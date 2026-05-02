import faiss
import numpy as np
import os
import json
import base64

FAISS_DIR = "faiss_indexes"
os.makedirs(FAISS_DIR, exist_ok=True)

EMBEDDING_DIM = 64


def get_index_path(event_id: str) -> str:
    return os.path.join(FAISS_DIR, f"{event_id}.index")


def get_map_path(event_id: str) -> str:
    return os.path.join(FAISS_DIR, f"{event_id}_map.json")


def add_to_index(event_id: str, embedding: list, photo_id: str, embedding_id: str, face_crop_bytes: bytes = None):
    index_path = get_index_path(event_id)
    map_path = get_map_path(event_id)

    if os.path.exists(index_path):
        index = faiss.read_index(index_path)
        with open(map_path, "r") as f:
            id_map = json.load(f)
    else:
        index = faiss.IndexFlatIP(EMBEDDING_DIM)
        id_map = []

    vec = np.array([embedding], dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    index.add(vec)

    face_b64 = ""
    if face_crop_bytes:
        face_b64 = base64.b64encode(face_crop_bytes).decode("utf-8")

    id_map.append({
        "photo_id": photo_id,
        "embedding_id": embedding_id,
        "face_b64": face_b64
    })

    faiss.write_index(index, index_path)
    with open(map_path, "w") as f:
        json.dump(id_map, f)


def rebuild_index_from_db(event_id: str, db) -> bool:
    """Rebuild FAISS index from DB — used when index files are missing."""
    from models.embedding import FaceEmbedding

    embeddings = db.query(FaceEmbedding).filter(
        FaceEmbedding.event_id == event_id
    ).all()

    if not embeddings:
        return False

    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    id_map = []

    for emb in embeddings:
        vec = np.array([emb.embedding], dtype=np.float32)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        index.add(vec)
        id_map.append({
            "photo_id": str(emb.photo_id),
            "embedding_id": str(emb.id),
            "face_b64": emb.face_crop_b64 or ""
        })

    faiss.write_index(index, get_index_path(event_id))
    with open(get_map_path(event_id), "w") as f:
        json.dump(id_map, f)

    return True


def search_index(event_id: str, query_embedding: list, top_k: int = 5, db=None) -> list:
    index_path = get_index_path(event_id)
    map_path = get_map_path(event_id)

    # If index missing, rebuild from DB
    if not os.path.exists(index_path) and db is not None:
        rebuilt = rebuild_index_from_db(event_id, db)
        if not rebuilt:
            return []

    if not os.path.exists(index_path):
        return []

    index = faiss.read_index(index_path)
    with open(map_path, "r") as f:
        id_map = json.load(f)

    if index.ntotal == 0:
        return []

    vec = np.array([query_embedding], dtype=np.float32)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    actual_k = min(top_k, index.ntotal)
    scores, indices = index.search(vec, actual_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        entry = id_map[idx]
        results.append({
            "photo_id": entry["photo_id"],
            "embedding_id": entry["embedding_id"],
            "face_b64": entry.get("face_b64", ""),
            "score": float(score)
        })

    return results