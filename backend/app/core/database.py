"""
database.py
-----------
Two database connections:
  - MySQL  → SQLAlchemy async (users, sessions)
  - MongoDB → Motor async    (boards, canvas)
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

# ── MySQL (SQLAlchemy) ───────────────────────────────────────────────────────
engine_kwargs = {"echo": False}
if "sqlite" not in settings.MYSQL_URI:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_async_engine(
    settings.MYSQL_URI,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db():
    """FastAPI dependency — yields an async MySQL session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def create_tables():
    """Create all MySQL tables on startup (if not exist)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ── MongoDB (Motor) ──────────────────────────────────────────────────────────
_mongo_client: AsyncIOMotorClient | None = None

def get_mongo_client() -> AsyncIOMotorClient:
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    return _mongo_client

def get_mongo_db():
    return get_mongo_client()[settings.DATABASE_NAME]
