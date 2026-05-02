from sqlalchemy import Column, String, Boolean, BigInteger, DateTime, Date, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admins.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(300), nullable=False)
    event_date = Column(Date, nullable=True)
    access_token = Column(String(64), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    link_expires_at = Column(DateTime(timezone=True), nullable=True)
    total_photos = Column(Integer, default=0)
    indexed_photos = Column(Integer, default=0)
    total_faces = Column(Integer, default=0)
    indexing_status = Column(String(20), default="idle")
    storage_used_bytes = Column(BigInteger, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())