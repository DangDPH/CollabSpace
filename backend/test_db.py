import asyncio
from app.core.database import AsyncSessionLocal
from app.repositories.user import user_repo
from app.schemas.user import RegisterRequest
import traceback

async def test():
    try:
        async with AsyncSessionLocal() as session:
            data = RegisterRequest(email="testdb@test.com", username="testdb", password="pw")
            user = await user_repo.create(session, data)
            print("User created:", user.id)
    except Exception as e:
        print("Error:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
