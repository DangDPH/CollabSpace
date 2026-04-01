"""
Repositories for Session (MySQL via SQLAlchemy async).
"""
import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import Session


class SessionRepository:
    async def create(
        self,
        db: AsyncSession,
        user_id: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> Session:
        session = Session(
            id=str(uuid.uuid4()),  # this becomes the JWT jti
            user_id=user_id,
            user_agent=user_agent,
            ip=ip,
            expires_at=expires_at,
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    async def get_by_id(self, db: AsyncSession, session_id: str) -> Session | None:
        result = await db.execute(
            select(Session).where(Session.id == session_id)
        )
        return result.scalar_one_or_none()

    async def revoke(self, db: AsyncSession, session_id: str) -> None:
        session = await self.get_by_id(db, session_id)
        if session:
            session.is_active = False
            await db.commit()


session_repo = SessionRepository()
