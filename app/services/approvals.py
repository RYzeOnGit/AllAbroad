"""Service helpers for the approval workflow."""
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.user import Admin, PendingApprovalUser, User
from app.schemas.auth import SignupRequest
from app.utils.auth import hash_password


async def _email_in_use(session: AsyncSession, email: str) -> bool:
    """Check for email collisions across pending users, users, and admins."""
    checks = [PendingApprovalUser, User, Admin]
    for model in checks:
        result = await session.execute(select(model).where(model.email == email))
        if result.scalar_one_or_none():
            return True
    return False


async def create_pending_user(
    session: AsyncSession, payload: SignupRequest
) -> PendingApprovalUser:
    email = payload.email.lower().strip()
    if await _email_in_use(session, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists or is pending approval",
        )

    pending = PendingApprovalUser(
        email=email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    session.add(pending)
    await session.commit()
    await session.refresh(pending)
    return pending


async def list_pending_users(session: AsyncSession) -> list[PendingApprovalUser]:
    result = await session.execute(
        select(PendingApprovalUser).order_by(PendingApprovalUser.created_at.desc())
    )
    return result.scalars().all()


async def count_pending_users(session: AsyncSession) -> int:
    """Lightweight COUNT for pending users. Prefer over len(list_pending_users())."""
    result = await session.execute(select(func.count(PendingApprovalUser.id)))
    return int(result.scalar() or 0)


async def approve_pending_user(session: AsyncSession, pending_user_id: int) -> User:
    pending_result = await session.execute(
        select(PendingApprovalUser).where(PendingApprovalUser.id == pending_user_id)
    )
    pending = pending_result.scalar_one_or_none()
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pending user not found"
        )

    email = pending.email.lower()
    user_exists = await session.execute(select(User).where(User.email == email))
    admin_exists = await session.execute(select(Admin).where(Admin.email == email))

    if user_exists.scalar_one_or_none() or admin_exists.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists in the system",
        )

    # Use transaction to prevent concurrent approval duplicates
    async with session.begin_nested():
        user = User(
            email=email,
            full_name=pending.full_name,
            password_hash=pending.password_hash,
            is_active=True,
        )
        session.add(user)
        await session.flush()

        await session.delete(pending)
        await session.commit()
    
    await session.refresh(user)

    return user


async def reject_pending_user(session: AsyncSession, pending_user_id: int) -> None:
    pending_result = await session.execute(
        select(PendingApprovalUser).where(PendingApprovalUser.id == pending_user_id)
    )
    pending = pending_result.scalar_one_or_none()
    if not pending:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pending user not found"
        )

    await session.delete(pending)
    await session.commit()


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


async def update_user_status(
    session: AsyncSession, user_id: int, is_active: bool
) -> User:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.is_active = is_active
    await session.commit()
    await session.refresh(user)
    return user


async def delete_user(session: AsyncSession, user_id: int) -> None:
    """Delete an approved user (User table only, not Admin)."""
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    await session.delete(user)
    await session.commit()
