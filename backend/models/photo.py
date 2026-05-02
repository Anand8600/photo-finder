from sqlalchemy import Column, String, BigInteger, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    original_path = Column(String(1000), nullable=False)
    thumbnail_path = Column(String(1000), nullable=False)
    original_filename = Column(String(500), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    face_count = Column(Integer, default=0)
    status = Column(String(20), default="pending")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())