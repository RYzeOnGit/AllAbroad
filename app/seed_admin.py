"""Seed a default admin user if missing.

Runs automatically on backend startup when ADMIN_EMAIL and ADMIN_PASSWORD are set in .env.
Also runnable standalone: python -m app.seed_admin
"""
import asyncio
import logging
import os
from sqlmodel import select

from email_validator import EmailNotValidError, validate_email

from app.config import settings
from app.database import init_db, async_session_maker
from app.models.user import Admin
from app.utils.auth import hash_password

logger = logging.getLogger(__name__)


async def seed_admin() -> None:
    """Create default admin if missing. Uses ADMIN_EMAIL and ADMIN_PASSWORD from config (.env)."""
    admin_email = (settings.admin_email or "").strip()
    admin_password = (settings.admin_password or "").strip()

    if not admin_email or not admin_password:
        logger.warning(
            "Admin seeding skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create an initial admin on startup."
        )
        return

    try:
        validate_email(admin_email, check_deliverability=False)
    except EmailNotValidError as e:
        raise ValueError(f"Invalid ADMIN_EMAIL: {e}") from e

    await init_db()

    async with async_session_maker() as session:
        result = await session.execute(select(Admin).where(Admin.email == admin_email.lower()))
        existing = result.scalar_one_or_none()
        if existing:
            logger.info("Admin already exists: %s", existing.email)
            return

        admin = Admin(
            email=admin_email.lower().strip(),
            full_name=os.getenv("ADMIN_FULL_NAME", "Administrator"),
            password_hash=hash_password(admin_password),
        )
        session.add(admin)
        await session.commit()
        logger.info("Admin created: %s", admin.email)


if __name__ == "__main__":
    import sys

    if not (settings.admin_email or "").strip() or not (settings.admin_password or "").strip():
        print("ADMIN_EMAIL and ADMIN_PASSWORD are required. Set them in .env or as env vars.", file=sys.stderr)
        sys.exit(1)
    asyncio.run(seed_admin())
