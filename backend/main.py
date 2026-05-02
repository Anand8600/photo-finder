from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from dotenv import load_dotenv
import os

load_dotenv()

import models.admin
import models.event
import models.photo
import models.embedding

from routers import auth, events, photos, process, search, superadmin

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Photo Finder", version="1.0")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(photos.router)
app.include_router(process.router)
app.include_router(search.router)
app.include_router(superadmin.router)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title="Photo Finder", version="1.0", routes=app.routes)
    schema["components"]["securitySchemes"] = {
        "Bearer": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
    }
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"Bearer": []}]
    app.openapi_schema = schema
    return schema

app.openapi = custom_openapi

@app.get("/")
def root():
    return {"status": "Photo Finder API is running"}

@app.get("/health")
def health():
    return {"database": "connected", "status": "ok"}