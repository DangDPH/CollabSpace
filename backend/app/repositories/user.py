"""
Repositories for User (MySQL via SQLAlchemy async).
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import hash_password
from app.schemas.user import RegisterRequest, UpdateUserRequest


class UserRepository:
    async def create(self, db: AsyncSession, data: RegisterRequest) -> User:
        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def get_by_id(self, db: AsyncSession, user_id: str) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def update(self, db: AsyncSession, user: User, data: UpdateUserRequest) -> User:
        for field, value in data.model_dump(exclude_unset=True).items():
            if field == "password" and value:
                user.password_hash = hash_password(value)
            elif field != "password":
                setattr(user, field, value)
        await db.commit()
        await db.refresh(user)
        return user

    async def delete(self, db: AsyncSession, user: User, soft: bool = True) -> User:
        if soft:
            user.is_active = False
            await db.commit()
            return user
        await db.delete(user)
        await db.commit()
        return user


user_repo = UserRepository()
