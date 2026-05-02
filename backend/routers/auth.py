from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.admin import Admin
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])
SECRET_KEY = os.getenv("SECRET_KEY", "changethislater")

# --- Schemas ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# --- Helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(admin_id: str) -> str:
    payload = {
        "sub": admin_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def get_current_admin(token: str, db: Session) -> Admin:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        admin = db.query(Admin).filter(Admin.id == admin_id).first()
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Endpoints ---
@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Admin).filter(Admin.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    admin = Admin(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password)
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = create_token(str(admin.id))
    return {
        "message": "Registered successfully",
        "token": token,
        "name": admin.name,
        "plan": admin.plan,
        "storage_used_bytes": admin.storage_used_bytes,
        "storage_limit_bytes": admin.storage_limit_bytes,
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == req.email).first()
    if not admin or not verify_password(req.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Your account has been disabled. Contact support at hello@snapfind.in")

    admin.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_token(str(admin.id))
    return {
        "message": "Login successful",
        "token": token,
        "name": admin.name,
        "plan": admin.plan,
        "storage_used_bytes": admin.storage_used_bytes,
        "storage_limit_bytes": admin.storage_limit_bytes,
    }

@router.get("/me")
def get_me(authorization: str = Header(...), db: Session = Depends(get_db)):
    from services.auth_dependency import get_admin
    admin = get_admin(authorization=authorization, db=db)
    return {
        "id": str(admin.id),
        "name": admin.name,
        "email": admin.email,
        "plan": admin.plan,
        "storage_used_bytes": admin.storage_used_bytes,
        "storage_limit_bytes": admin.storage_limit_bytes,
        "is_active": admin.is_active,
    }

@router.put("/change-password")
def change_password(req: ChangePasswordRequest, authorization: str = Header(...), db: Session = Depends(get_db)):
    from services.auth_dependency import get_admin
    admin = get_admin(authorization=authorization, db=db)

    if not verify_password(req.current_password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    admin.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}