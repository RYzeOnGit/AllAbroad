"""Seed a default admin user if missing.

Usage:
    ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpassword \
    python -m app.seed_admin
"""
import asyncio
import os
from sqlmodel import select

from app.config import settings
from app.database import init_db, async_session_maker
from app.models.user import Admin
from app.utils.auth import hash_password


async def seed_admin() -> None:
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        raise SystemExit("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required")

    await init_db()

    async with async_session_maker() as session:
        result = await session.execute(select(Admin).where(Admin.email == admin_email.lower()))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Admin already exists: {existing.email}")
            return

        admin = Admin(
            email=admin_email.lower().strip(),
            full_name=os.getenv("ADMIN_FULL_NAME", "Administrator"),
            password_hash=hash_password(admin_password),
        )
        session.add(admin)
        await session.commit()
        print(f"Admin created: {admin.email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
