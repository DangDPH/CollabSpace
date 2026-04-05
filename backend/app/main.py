"""
FastAPI application entry point.
- MySQL for users/sessions (SQLAlchemy async)
- MongoDB for boards/canvas (Motor)
- CORS enabled for frontend dev server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import create_tables
from app.core.config import settings
from app.api.user import router as user_router
from app.api.board import router as board_router
from app.api.ws import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create MySQL tables on startup if they don't exist
    await create_tables()
    yield


app = FastAPI(
    title="CollabSpace API",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Configuration ──────────────────────────────────────────
# Reads ALLOWED_ORIGINS from .env
#   "*"                               → allow all origins (development)
#   "https://app.example.com"         → single origin (production)
#   "https://a.com,https://b.com"     → multiple origins (production)
_raw = settings.ALLOWED_ORIGINS.strip()

if _raw == "*":
    # Development: allow everything
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,   # credentials + wildcard not allowed by browsers
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Production: explicit origin list
    origins = [o.strip() for o in _raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Auth / User routes
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])

# Board Data routes
app.include_router(board_router, prefix="/api/v1/boards", tags=["Boards"])

# WebSocket Real-time collaboration routes
app.include_router(ws_router, tags=["Real-time Canvas"])


@app.get("/health")
async def health():
    return {"status": "ok"}