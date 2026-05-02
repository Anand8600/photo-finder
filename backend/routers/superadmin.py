from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models.admin import Admin
from routers.auth import hash_password, create_token
import jwt
import os
from datetime import datetime, timezone

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])

SUPERADMIN_EMAIL = os.getenv("SUPERADMIN_EMAIL", "admin@snapfind.in")
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "SuperAdmin@123")
SUPERADMIN_SECRET = os.getenv("SUPERADMIN_SECRET", "superadmin_secret")

# --- Schemas ---
class SuperAdminLogin(BaseModel):
    email: str
    password: str

class CreateClientRequest(BaseModel):
    name: str
    email: str
    password: str
    plan: str = "free"
    storage_limit_bytes: int = 524288000  # 500MB default

class UpdateClientRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    plan: Optional[str] = None
    storage_limit_bytes: Optional[int] = None
    is_active: Optional[bool] = None

class ResetPasswordRequest(BaseModel):
    new_password: str

# --- Super Admin JWT ---
def create_superadmin_token() -> str:
    payload = {
        "sub": "superadmin",
        "role": "superadmin",
        "exp": datetime.now(timezone.utc).timestamp() + (24 * 3600)
    }
    return jwt.encode(payload, SUPERADMIN_SECRET, algorithm="HS256")

def verify_superadmin_token(authorization: str) -> bool:
    try:
        if not authorization.startswith("Bearer "):
            return False
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SUPERADMIN_SECRET, algorithms=["HS256"])
        return payload.get("role") == "superadmin"
    except Exception:
        return False

def require_superadmin(authorization: str = None):
    from fastapi import Header
    return authorization

# --- Dependency ---
from fastapi import Header

def get_superadmin(authorization: str = Header(...)):
    if not verify_superadmin_token(authorization):
        raise HTTPException(status_code=401, detail="Super admin access required")

# --- Endpoints ---
@router.post("/login")
def superadmin_login(req: SuperAdminLogin):
    if req.email != SUPERADMIN_EMAIL or req.password != SUPERADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid super admin credentials")
    token = create_superadmin_token()
    return {"token": token, "role": "superadmin"}

@router.get("/clients")
def list_clients(db: Session = Depends(get_db), _=Depends(get_superadmin)):
    clients = db.query(Admin).order_by(Admin.created_at.desc()).all()
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "email": c.email,
            "plan": c.plan,
            "is_active": c.is_active,
            "storage_limit_bytes": c.storage_limit_bytes,
            "storage_used_bytes": c.storage_used_bytes,
            "created_at": str(c.created_at),
            "last_login_at": str(c.last_login_at) if c.last_login_at else None,
        }
        for c in clients
    ]

@router.post("/clients")
def create_client(req: CreateClientRequest, db: Session = Depends(get_db), _=Depends(get_superadmin)):
    existing = db.query(Admin).filter(Admin.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    storage_limits = {
        "free": 524288000,       # 500MB
        "basic": 5368709120,     # 5GB
        "pro": 21474836480,      # 20GB
        "enterprise": 107374182400  # 100GB
    }

    client = Admin(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        plan=req.plan,
        storage_limit_bytes=storage_limits.get(req.plan, req.storage_limit_bytes)
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    return {
        "id": str(client.id),
        "name": client.name,
        "email": client.email,
        "plan": client.plan,
        "message": "Client created successfully"
    }

@router.put("/clients/{client_id}")
def update_client(client_id: str, req: UpdateClientRequest, db: Session = Depends(get_db), _=Depends(get_superadmin)):
    client = db.query(Admin).filter(Admin.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if req.name is not None:
        client.name = req.name
    if req.email is not None:
        existing = db.query(Admin).filter(Admin.email == req.email, Admin.id != client_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        client.email = req.email
    if req.plan is not None:
        client.plan = req.plan
        storage_limits = {
            "free": 524288000,
            "basic": 5368709120,
            "pro": 21474836480,
            "enterprise": 107374182400
        }
        client.storage_limit_bytes = storage_limits.get(req.plan, client.storage_limit_bytes)
    if req.storage_limit_bytes is not None:
        client.storage_limit_bytes = req.storage_limit_bytes
    if req.is_active is not None:
        client.is_active = req.is_active

    db.commit()
    return {"message": "Client updated successfully", "id": str(client.id)}

@router.put("/clients/{client_id}/reset-password")
def reset_client_password(client_id: str, req: ResetPasswordRequest, db: Session = Depends(get_db), _=Depends(get_superadmin)):
    client = db.query(Admin).filter(Admin.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": f"Password reset successfully for {client.name}"}

@router.delete("/clients/{client_id}")
def delete_client(client_id: str, db: Session = Depends(get_db), _=Depends(get_superadmin)):
    client = db.query(Admin).filter(Admin.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}