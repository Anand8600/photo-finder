from sqlalchemy import Column, Float, DateTime, Integer, ForeignKey, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id", ondelete="CASCADE"), nullable=False)
    embedding = Column(ARRAY(Float), nullable=False)
    detection_score = Column(Float, nullable=False)
    face_angle_yaw = Column(Float, nullable=True)
    face_angle_pitch = Column(Float, nullable=True)
    blur_score = Column(Float, nullable=True)
    face_size_px = Column(Integer, nullable=True)
    face_crop_b64 = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())