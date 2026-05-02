from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
from database import get_db
from models.event import Event
from models.admin import Admin
from services.auth_dependency import get_admin
import secrets

router = APIRouter(prefix="/api/admin/events", tags=["events"])

# --- Schemas ---
class CreateEventRequest(BaseModel):
    name: str
    event_date: Optional[date] = None

class UpdateEventRequest(BaseModel):
    name: Optional[str] = None
    event_date: Optional[date] = None

# --- Endpoints ---
@router.post("")
def create_event(req: CreateEventRequest, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    token = secrets.token_urlsafe(32)
    
    event = Event(
        admin_id=admin.id,
        name=req.name,
        event_date=req.event_date,
        access_token=token
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return {
        "id": str(event.id),
        "name": event.name,
        "event_date": str(event.event_date) if event.event_date else None,
        "access_token": event.access_token,
        "share_url": f"http://localhost:3000/e/{event.access_token}",
        "indexing_status": event.indexing_status,
        "total_photos": event.total_photos,
        "created_at": str(event.created_at)
    }

@router.get("")
def list_events(db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    events = db.query(Event).filter(Event.admin_id == admin.id).order_by(Event.created_at.desc()).all()
    
    return [
        {
            "id": str(e.id),
            "name": e.name,
            "event_date": str(e.event_date) if e.event_date else None,
            "access_token": e.access_token,
            "is_active": e.is_active,
            "total_photos": e.total_photos,
            "indexed_photos": e.indexed_photos,
            "indexing_status": e.indexing_status,
            "created_at": str(e.created_at)
        }
        for e in events
    ]

@router.get("/{event_id}")
def get_event(event_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {
        "id": str(event.id),
        "name": event.name,
        "event_date": str(event.event_date) if event.event_date else None,
        "access_token": event.access_token,
        "share_url": f"http://localhost:3000/e/{event.access_token}",
        "is_active": event.is_active,
        "total_photos": event.total_photos,
        "indexed_photos": event.indexed_photos,
        "total_faces": event.total_faces,
        "indexing_status": event.indexing_status,
        "storage_used_bytes": event.storage_used_bytes,
        "created_at": str(event.created_at)
    }

@router.put("/{event_id}/toggle")
def toggle_event(event_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.is_active = not event.is_active
    db.commit()
    
    return {"id": str(event.id), "is_active": event.is_active}

@router.delete("/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_admin)):
    event = db.query(Event).filter(Event.id == event_id, Event.admin_id == admin.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return {"message": "Event deleted successfully"}