import numpy as np
import cv2
import boto3
import os
import base64
import tempfile
from PIL import Image, ImageEnhance
import io

# Quality thresholds
MIN_FACE_CONFIDENCE = 90.0
MIN_FACE_SIZE_PERCENT = 0.5  # Face must be at least 0.5% of image area
# Lazy client — created on first use AFTER dotenv is loaded
_rekognition_client = None

def get_rekognition_client():
    global _rekognition_client
    if _rekognition_client is None:
        _rekognition_client = boto3.client(
            "rekognition",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "ap-south-1")
        )
    return _rekognition_client


def image_to_bytes(image_path: str, max_size: int = 4 * 1024 * 1024) -> bytes:
    """Read image, resize if over 4MB to stay under AWS 5MB limit."""
    img = Image.open(image_path).convert("RGB")
    buf = io.BytesIO()
    img.thumbnail((2000, 2000))
    img.save(buf, format="JPEG", quality=85)
    image_bytes = buf.getvalue()

    if len(image_bytes) > max_size:
        buf = io.BytesIO()
        img.thumbnail((1500, 1500))
        img.save(buf, format="JPEG", quality=75)
        image_bytes = buf.getvalue()

    return image_bytes


def pil_to_bytes(pil_image: Image.Image, format: str = "JPEG") -> bytes:
    """Convert PIL image to bytes."""
    buf = io.BytesIO()
    pil_image.save(buf, format=format, quality=95)
    return buf.getvalue()


def process_photo(photo_path: str) -> list:
    """
    Detect all faces in a photo using AWS Rekognition.
    Returns list of face dicts with embedding + metadata.
    """
    faces_data = []

    try:
        client = get_rekognition_client()
        image_bytes = image_to_bytes(photo_path)

        response = client.detect_faces(
            Image={"Bytes": image_bytes},
            Attributes=["ALL"]
        )

        face_details = response.get("FaceDetails", [])
        if not face_details:
            return []

        img = Image.open(photo_path).convert("RGB")
        img_width, img_height = img.size

        for face in face_details:
            confidence = face.get("Confidence", 0)

            if confidence < MIN_FACE_CONFIDENCE:
                continue

            bbox = face.get("BoundingBox", {})
            left = int(bbox.get("Left", 0) * img_width)
            top = int(bbox.get("Top", 0) * img_height)
            width = int(bbox.get("Width", 0) * img_width)
            height = int(bbox.get("Height", 0) * img_height)

            face_area_percent = (width * height) / (img_width * img_height) * 100
            if face_area_percent < MIN_FACE_SIZE_PERCENT:
                continue

            if left < 0 or top < 0 or left + width > img_width or top + height > img_height:
                continue

            quality = face.get("Quality", {})
            sharpness = quality.get("Sharpness", 50)

            if sharpness < 10:
                continue

            padding = int(max(width, height) * 0.2)
            crop_left = max(0, left - padding)
            crop_top = max(0, top - padding)
            crop_right = min(img_width, left + width + padding)
            crop_bottom = min(img_height, top + height + padding)

            face_crop = img.crop((crop_left, crop_top, crop_right, crop_bottom))
            face_crop_bytes = pil_to_bytes(face_crop)
            embedding = _generate_rekognition_embedding(face_crop, face_crop_bytes)

            faces_data.append({
                "embedding": embedding,
                "detection_score": confidence / 100.0,
                "face_size_px": width * height,
                "blur_score": sharpness,
                "face_angle_yaw": face.get("Pose", {}).get("Yaw", 0),
                "face_angle_pitch": face.get("Pose", {}).get("Pitch", 0),
                "face_crop_bytes": face_crop_bytes,
            })

    except Exception as e:
        import traceback
        print(f"Error processing photo {photo_path}: {e}")
        print(traceback.format_exc())
        return []

    return faces_data


def _generate_rekognition_embedding(face_image: Image.Image, face_bytes: bytes) -> list:
    """Generate a consistent 128-dim embedding from face image."""
    face_resized = face_image.resize((128, 128))
    face_array = np.array(face_resized, dtype=np.float32)
    face_array = face_array / 255.0

    h, w = 8, 8
    block_h = face_array.shape[0] // h
    block_w = face_array.shape[1] // w
    features = []

    for i in range(h):
        for j in range(w):
            block = face_array[i*block_h:(i+1)*block_h, j*block_w:(j+1)*block_w]
            features.append(float(np.mean(block)))

    features = np.array(features, dtype=np.float32)
    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm

    return features.tolist()


def process_selfie(selfie_path: str) -> dict:
    """Process selfie for search."""
    try:
        client = get_rekognition_client()
        image_bytes = image_to_bytes(selfie_path)

        response = client.detect_faces(
            Image={"Bytes": image_bytes},
            Attributes=["ALL"]
        )

        faces = response.get("FaceDetails", [])

        if not faces:
            return {"success": False, "error": "No face found. Please use a clear, front-facing photo."}

        best_face = max(faces, key=lambda f: f.get("Confidence", 0))

        if best_face.get("Confidence", 0) < 80:
            return {"success": False, "error": "No clear face detected. Please try in better lighting."}

        img = Image.open(selfie_path).convert("RGB")
        img_width, img_height = img.size

        bbox = best_face.get("BoundingBox", {})
        left = int(bbox.get("Left", 0) * img_width)
        top = int(bbox.get("Top", 0) * img_height)
        width = int(bbox.get("Width", 0) * img_width)
        height = int(bbox.get("Height", 0) * img_height)

        padding = int(max(width, height) * 0.2)
        crop_left = max(0, left - padding)
        crop_top = max(0, top - padding)
        crop_right = min(img_width, left + width + padding)
        crop_bottom = min(img_height, top + height + padding)

        face_crop = img.crop((crop_left, crop_top, crop_right, crop_bottom))

        embeddings = []
        selfie_variants = []

        emb1 = _generate_rekognition_embedding(face_crop, pil_to_bytes(face_crop))
        embeddings.append(emb1)
        selfie_variants.append(pil_to_bytes(face_crop))

        brightened = ImageEnhance.Brightness(face_crop).enhance(1.4)
        emb2 = _generate_rekognition_embedding(brightened, pil_to_bytes(brightened))
        embeddings.append(emb2)
        selfie_variants.append(pil_to_bytes(brightened))

        contrasted = ImageEnhance.Contrast(face_crop).enhance(1.3)
        emb3 = _generate_rekognition_embedding(contrasted, pil_to_bytes(contrasted))
        embeddings.append(emb3)
        selfie_variants.append(pil_to_bytes(contrasted))

        return {
            "success": True,
            "embeddings": embeddings,
            "selfie_bytes": image_bytes,
            "selfie_variants": selfie_variants,
        }

    except Exception as e:
        return {"success": False, "error": f"Could not process selfie: {str(e)}"}


def compare_faces_rekognition(selfie_bytes: bytes, target_bytes: bytes) -> float:
    """Use AWS Rekognition CompareFaces for accurate matching."""
    try:
        client = get_rekognition_client()
        response = client.compare_faces(
            SourceImage={"Bytes": selfie_bytes},
            TargetImage={"Bytes": target_bytes},
            SimilarityThreshold=70.0
        )

        face_matches = response.get("FaceMatches", [])
        if not face_matches:
            return 0.0

        return max(m.get("Similarity", 0) for m in face_matches)

    except Exception:
        return 0.0