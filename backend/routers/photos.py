from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Annotated
from database import get_db
from models.photo import Photo
from models.event import Event
from models.admin import Admin
from services.auth_dependency import get_admin
from services.storage import save_photo, delete_photo_files
import os

router = APIRouter(prefix="/api/admin/events", tags=["photos"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB

@router.post("/{event_id}/photos")
async def upload_photos(
    event_id: str,
    files: Annotated[List[UploadFile], File(description="Select one or more photos")],
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_admin)
):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    results = []

    for file in files:
        if file.content_type not in ALLOWED_TYPES:
            results.append({"filename": file.filename, "status": "failed", "error": "Invalid file type"})
            continue

        file_bytes = await file.read()

        if len(file_bytes) > MAX_FILE_SIZE:
            results.append({"filename": file.filename, "status": "failed", "error": "File too large (max 15MB)"})
            continue

        try:
            saved = save_photo(file_bytes, file.filename, event_id)

            photo = Photo(
                event_id=event_id,
                original_path=saved["original_path"],
                thumbnail_path=saved["thumbnail_path"],
                original_filename=file.filename,
                file_size_bytes=saved["file_size_bytes"],
                width=saved["width"],
                height=saved["height"],
                status="pending"
            )
            db.add(photo)
            db.flush()

            results.append({
                "filename": file.filename,
                "photo_id": str(photo.id),
                "status": "uploaded",
                "thumbnail": saved["thumbnail_path"]
            })

        except Exception as e:
            results.append({"filename": file.filename, "status": "failed", "error": str(e)})

    # Update counts and storage
    success_count = sum(1 for r in results if r["status"] == "uploaded")
    total_size = sum(
        r.get("file_size_bytes", 0) for r in results if r["status"] == "uploaded"
    )

    # Get total size from saved photos (more accurate)
    uploaded_size = 0
    for r in results:
        if r["status"] == "uploaded":
            photo_obj = db.query(Photo).filter(Photo.id == r.get("photo_id")).first()
            if photo_obj:
                uploaded_size += photo_obj.file_size_bytes or 0

    event.total_photos += success_count
    event.storage_used_bytes += uploaded_size

    # Update admin storage
    admin_record = db.query(Admin).filter(Admin.id == admin.id).first()
    if admin_record:
        admin_record.storage_used_bytes += uploaded_size

    db.commit()

    return {
        "uploaded": success_count,
        "failed": len(results) - success_count,
        "results": results
    }


@router.get("/{event_id}/photos")
def list_photos(event_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    photos = db.query(Photo).filter(Photo.event_id == event_id).all()
    return [
        {
            "id": str(p.id),
            "filename": p.original_filename,
            "status": p.status,
            "face_count": p.face_count,
            "file_size_bytes": p.file_size_bytes,
            "uploaded_at": str(p.uploaded_at)
        }
        for p in photos
    ]


@router.delete("/{event_id}/photos/{photo_id}")
def delete_photo(event_id: str, photo_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    photo = db.query(Photo).filter(Photo.id == photo_id, Photo.event_id == event_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    file_size = photo.file_size_bytes or 0

    delete_photo_files(photo.original_path, photo.thumbnail_path)
    db.delete(photo)

    event.total_photos = max(0, event.total_photos - 1)
    event.storage_used_bytes = max(0, event.storage_used_bytes - file_size)

    # Update admin storage
    admin_record = db.query(Admin).filter(Admin.id == admin.id).first()
    if admin_record:
        admin_record.storage_used_bytes = max(0, admin_record.storage_used_bytes - file_size)

    db.commit()

    return {"message": "Photo deleted"}


@router.get("/{event_id}/photos/{photo_id}/thumbnail")
def get_thumbnail(event_id: str, photo_id: str, db: Session = Depends(get_db)):
    photo = db.query(Photo).filter(Photo.id == photo_id, Photo.event_id == event_id).first()
    if not photo or not os.path.exists(photo.thumbnail_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(photo.thumbnail_path, media_type="image/jpeg")