"""
SQLAlchemy ORM models stored in MySQL (users and sessions).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def _now():
    return datetime.now(timezone.utc)


def _new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str]          = mapped_column(String(36), primary_key=True, default=_new_id)
    email: Mapped[str]       = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str]    = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str]        = mapped_column(String(50), default="user")
    is_active: Mapped[bool]  = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str]           = mapped_column(String(36), primary_key=True, default=_new_id)
    user_id: Mapped[str]      = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip: Mapped[str | None]    = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool]   = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user: Mapped["User"] = relationship("User", back_populates="sessions")
