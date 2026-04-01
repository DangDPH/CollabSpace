"""
Business-logic layer for User auth (register, login, logout).
"""
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user import user_repo
from app.repositories.session import session_repo
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.schemas.user import RegisterRequest, LoginRequest, LoginResponse


class UserService:
    async def register(self, db: AsyncSession, data: RegisterRequest):
        existing = await user_repo.get_by_email(db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )
        return await user_repo.create(db, data)

    async def login(
        self,
        db: AsyncSession,
        data: LoginRequest,
        user_agent: str | None = None,
        ip: str | None = None,
    ) -> LoginResponse:
        user = await user_repo.get_by_email(db, data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled.",
            )

        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        expires_at    = datetime.now(timezone.utc) + expires_delta

        session = await session_repo.create(
            db, user_id=user.id, expires_at=expires_at,
            user_agent=user_agent, ip=ip,
        )

        access_token = create_access_token(
            subject=user.id, expires_delta=expires_delta, jti=session.id
        )

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user,
        )

    async def logout(self, db: AsyncSession, session_id: str):
        await session_repo.revoke(db, session_id)


user_service = UserService()
