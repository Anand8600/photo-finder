from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Annotated
from database import get_db
from models.event import Event
from models.photo import Photo
from services.face_service import process_selfie, compare_faces_rekognition
from services.faiss_service import search_index
import os
import tempfile
import base64

router = APIRouter(tags=["search"])

REKOGNITION_THRESHOLD = 80  # AWS Rekognition scale: 0-100

@router.get("/e/{token}")
def get_event_page(token: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(
        Event.access_token == token,
        Event.is_active == True
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not active")
    return {
        "event_id": str(event.id),
        "name": event.name,
        "event_date": str(event.event_date) if event.event_date else None,
        "total_photos": event.total_photos,
        "indexed_photos": event.indexed_photos,
        "is_ready": event.indexing_status == "done"
    }


@router.post("/api/search/{token}")
async def search_photos(
    token: str,
    selfie: Annotated[UploadFile, File(description="Upload your selfie")],
    db: Session = Depends(get_db)
):
    # Validate event
    event = db.query(Event).filter(
        Event.access_token == token,
        Event.is_active == True
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not active")

    if event.indexing_status != "done" and event.indexed_photos == 0:
        raise HTTPException(status_code=400, detail="Event photos are still being processed. Please wait.")

    # Validate selfie
    allowed = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if selfie.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a photo.")

    selfie_bytes = await selfie.read()
    # Resize selfie if too large (Rekognition limit is 5MB)
    if len(selfie_bytes) > 4 * 1024 * 1024:
        from PIL import Image
        import io as _io
        img = Image.open(_io.BytesIO(selfie_bytes)).convert("RGB")
        img.thumbnail((2000, 2000))
        buf = _io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        selfie_bytes = buf.getvalue()

    # Save selfie to temp file
    suffix = "." + selfie.filename.rsplit(".", 1)[-1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(selfie_bytes)
        tmp_path = tmp.name

    try:
        # Process selfie
        selfie_result = process_selfie(tmp_path)
        if not selfie_result["success"]:
            raise HTTPException(status_code=400, detail=selfie_result["error"])

        embeddings_to_search = selfie_result["embeddings"]
        selfie_image_bytes = selfie_result.get("selfie_bytes")

        # Step 1: FAISS pre-filter — get top candidates quickly
        faiss_candidates = {}
        for emb in embeddings_to_search:
            matches = search_index(str(event.id), emb, top_k=5, db=db)
            for match in matches:
                photo_id = match["photo_id"]
                key = f"{photo_id}_{match['embedding_id']}"
                if key not in faiss_candidates:
                    faiss_candidates[key] = match
        
        # Step 2: AWS Rekognition — accurate final verification
        all_results = {}

        for key, candidate in faiss_candidates.items():
            photo_id = candidate["photo_id"]
            face_b64 = candidate.get("face_b64", "")

            if not face_b64 or not selfie_image_bytes:
                continue

            try:
                target_bytes = base64.b64decode(face_b64)
                similarity = compare_faces_rekognition(selfie_image_bytes, target_bytes)
                if similarity >= REKOGNITION_THRESHOLD:
                    if photo_id not in all_results or similarity > all_results[photo_id]:
                        all_results[photo_id] = similarity
            except Exception as e:
                continue

        # Build results
        matched_photos = []
        for photo_id, similarity in all_results.items():
            photo = db.query(Photo).filter(Photo.id == photo_id).first()
            if photo:
                matched_photos.append({
                    "photo_id": str(photo.id),
                    "filename": photo.original_filename,
                    "score": round(similarity / 100, 4),
                    "thumbnail_url": f"http://localhost:8000/api/search/{token}/photo/{photo.id}/thumbnail",
                    "download_url": f"http://localhost:8000/api/search/{token}/photo/{photo.id}/download"
                })

        matched_photos.sort(key=lambda x: x["score"], reverse=True)

        return {
            "found": len(matched_photos),
            "message": f"Found {len(matched_photos)} photos with you!" if matched_photos else "No photos found for you in this event.",
            "photos": matched_photos
        }

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/api/search/{token}/photo/{photo_id}/thumbnail")
def get_photo_thumbnail(token: str, photo_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.access_token == token).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    photo = db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.event_id == event.id
    ).first()
    if not photo or not os.path.exists(photo.thumbnail_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(photo.thumbnail_path, media_type="image/jpeg")


@router.get("/api/search/{token}/photo/{photo_id}/download")
def download_photo(token: str, photo_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.access_token == token).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    photo = db.query(Photo).filter(
        Photo.id == photo_id,
        Photo.event_id == event.id
    ).first()
    if not photo or not os.path.exists(photo.original_path):
        raise HTTPException(status_code=404, detail="Photo not found")
    return FileResponse(
        photo.original_path,
        media_type="image/jpeg",
        filename=photo.original_filename
    )