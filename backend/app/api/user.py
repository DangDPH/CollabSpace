"""
User router — public register/login + authenticated me/logout.
"""
from typing import Any
from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.session import require_authenticated, get_current_jti
from app.services.user import user_service
from app.repositories.user import user_repo
from app.core.security import verify_password, hash_password
from app.schemas.user import (
    RegisterRequest, LoginRequest, LoginResponse, UserResponse, ChangePasswordRequest
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> Any:
    """Public endpoint — create a new account."""
    return await user_service.register(db, payload)


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)) -> Any:
    """Public endpoint — returns JWT access token."""
    user_agent = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    return await user_service.login(db, payload, user_agent=user_agent, ip=ip)


@router.post("/logout", status_code=200)
async def logout(
    session_id: str = Depends(get_current_jti),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_authenticated),
) -> Any:
    """Authenticated — invalidates the current session."""
    await user_service.logout(db, session_id)
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(require_authenticated)) -> Any:
    """Authenticated — returns current user profile."""
    return current_user


@router.patch("/me/password", status_code=200)
async def change_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_authenticated),
) -> Any:
    """Authenticated — changes the current user's password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    current_user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password updated successfully."}
