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

# Allow the Vite dev server to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth / User routes
app.include_router(user_router, prefix="/api/v1/users", tags=["Users"])

# Board Data routes
app.include_router(board_router, prefix="/api/v1/boards", tags=["Boards"])

# WebSocket Real-time collaboration routes
# WebSockets typically don't use prefixes with versioning in the same way, but we will root them at /ws
app.include_router(ws_router, tags=["Real-time Canvas"])


@app.get("/health")
async def health():
    return {"status": "ok"}