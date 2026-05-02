from fastapi import Header, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_admin
from models.admin import Admin

def get_admin(authorization: str = Header(...), db: Session = Depends(get_db)) -> Admin:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    token = authorization.split(" ")[1]
    return get_current_admin(token, db)