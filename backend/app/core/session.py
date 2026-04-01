"""
FastAPI auth dependencies — validates JWT and loads current user from MySQL.
"""
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.repositories.user import user_repo
from app.repositories.session import session_repo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        session_id: str = payload.get("jti")
        user_id: str    = payload.get("sub")
        if not session_id or not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    session = await session_repo.get_by_id(db, session_id)
    if not session or not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or been logged out.",
        )

    user = await user_repo.get_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or disabled.")

    return user


async def get_current_jti(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(status_code=401, detail="Invalid token")
        return jti
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_authenticated(current_user=Depends(get_current_user)):
    return current_user
