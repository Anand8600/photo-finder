import os
import uuid
from PIL import Image
from config import UPLOAD_DIR

def save_photo(file_bytes: bytes, filename: str, event_id: str) -> dict:
    """Save original photo + create thumbnail. Returns paths."""
    
    ext = filename.rsplit(".", 1)[-1].lower()
    unique_name = f"{uuid.uuid4()}.{ext}"
    
    # Create event folders
    original_dir = os.path.join(UPLOAD_DIR, event_id, "original")
    thumb_dir = os.path.join(UPLOAD_DIR, event_id, "thumbs")
    os.makedirs(original_dir, exist_ok=True)
    os.makedirs(thumb_dir, exist_ok=True)
    
    # Save original
    original_path = os.path.join(original_dir, unique_name)
    with open(original_path, "wb") as f:
        f.write(file_bytes)
    
    # Create thumbnail (800px wide, keep aspect ratio)
    thumb_path = os.path.join(thumb_dir, unique_name)
    try:
        img = Image.open(original_path)
        img = img.convert("RGB")  # handles PNG with transparency
        img.thumbnail((800, 800))
        img.save(thumb_path, "JPEG", quality=85)
        width, height = img.size
    except Exception:
        # If thumbnail fails, copy original
        import shutil
        shutil.copy(original_path, thumb_path)
        width, height = 0, 0
    
    return {
        "original_path": original_path,
        "thumbnail_path": thumb_path,
        "width": width,
        "height": height,
        "file_size_bytes": len(file_bytes)
    }

def delete_photo_files(original_path: str, thumbnail_path: str):
    """Delete photo files from disk."""
    for path in [original_path, thumbnail_path]:
        if path and os.path.exists(path):
            os.remove(path)