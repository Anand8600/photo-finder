from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models.photo import Photo
from models.event import Event
from models.embedding import FaceEmbedding
from models.admin import Admin
from services.auth_dependency import get_admin
from services.face_service import process_photo
from services.faiss_service import add_to_index
import base64

router = APIRouter(prefix="/api/admin/events", tags=["process"])


def index_photo_task(photo_id: str):
    db = SessionLocal()
    try:
        photo = db.query(Photo).filter(Photo.id == photo_id).first()
        if not photo:
            return

        photo.status = "processing"
        db.commit()

        try:
            faces = process_photo(photo.original_path)
            photo.face_count = len(faces)

            for face in faces:
                face_b64 = ""
                if face.get("face_crop_bytes"):
                    face_b64 = base64.b64encode(face["face_crop_bytes"]).decode("utf-8")

                emb = FaceEmbedding(
                    event_id=photo.event_id,
                    photo_id=photo.id,
                    embedding=face["embedding"],
                    detection_score=face["detection_score"],
                    face_size_px=face["face_size_px"],
                    blur_score=face["blur_score"],
                    face_angle_yaw=face["face_angle_yaw"],
                    face_angle_pitch=face["face_angle_pitch"],
                    face_crop_b64=face_b64
                )
                db.add(emb)
                db.flush()

                add_to_index(
                    event_id=str(photo.event_id),
                    embedding=face["embedding"],
                    photo_id=str(photo.id),
                    embedding_id=str(emb.id),
                    face_crop_bytes=face.get("face_crop_bytes")
                )

            photo.status = "done"

            event = db.query(Event).filter(Event.id == photo.event_id).first()
            if event:
                event.indexed_photos += 1
                event.total_faces += len(faces)
                event.indexing_status = "done"

            db.commit()

        except Exception as e:
            import traceback
            print(f"Error processing photo {photo_id}: {e}")
            traceback.print_exc()
            photo.status = "failed"
            db.commit()

    finally:
        db.close()


@router.post("/{event_id}/process")
def process_event_photos(
    event_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_admin)
):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    pending = db.query(Photo).filter(
        Photo.event_id == event_id,
        Photo.status == "pending"
    ).all()

    if not pending:
        return {"message": "No pending photos to process", "count": 0}

    event.indexing_status = "processing"
    db.commit()

    for photo in pending:
        background_tasks.add_task(index_photo_task, str(photo.id))

    return {
        "message": f"Processing started for {len(pending)} photos",
        "count": len(pending)
    }


@router.get("/{event_id}/progress")
def get_progress(event_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    total = db.query(Photo).filter(Photo.event_id == event_id).count()
    done = db.query(Photo).filter(Photo.event_id == event_id, Photo.status == "done").count()
    failed = db.query(Photo).filter(Photo.event_id == event_id, Photo.status == "failed").count()
    processing = db.query(Photo).filter(Photo.event_id == event_id, Photo.status == "processing").count()

    return {
        "total": total,
        "done": done,
        "failed": failed,
        "processing": processing,
        "pending": total - done - failed - processing,
        "indexing_status": event.indexing_status,
        "total_faces": event.total_faces
    }