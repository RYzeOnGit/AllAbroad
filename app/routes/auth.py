import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models.user import Admin, PendingApprovalUser, User
from app.models.student import Student

logger = logging.getLogger(__name__)
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    ProfileResponse,
    SignupRequest,
)
from app.services import approvals
from app.utils.count_cache import invalidate
from app.utils.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, session: AsyncSession = Depends(get_session)):
    """Register a user into the pending approvals table."""
    await approvals.create_pending_user(session, payload)
    invalidate("pending_users")
    return {"message": "Signup received. Await admin approval."}


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_session)):
    """Login endpoint that prefers admin accounts, then users, then students."""
    email = request.email.lower().strip()

    # Try admin first
    admin_stmt = select(Admin).where(Admin.email == email)
    admin_res = await session.execute(admin_stmt)
    admin = admin_res.scalar_one_or_none()
    if admin and verify_password(request.password, admin.password_hash):
        token = create_access_token(
            data={"sub": str(admin.id), "email": admin.email, "role": "admin"},
            expires_delta=timedelta(minutes=60),
        )
        return LoginResponse(access_token=token, token_type="bearer", role="admin")

    # Try user (staff) second
    user_stmt = select(User).where(User.email == email)
    user_res = await session.execute(user_stmt)
    user = user_res.scalar_one_or_none()

    if user:
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your account has been deactivated.")
        token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": "user"},
            expires_delta=timedelta(minutes=60),
        )
        return LoginResponse(access_token=token, token_type="bearer", role="user")
    
    # Try student last
    logger.info(f"Checking student login for email: {email}")
    try:
        student_stmt = select(Student).where(Student.email == email)
        student_res = await session.execute(student_stmt)
        student = student_res.scalar_one_or_none()
        logger.info(f"Student query result: {'found' if student else 'not found'}")
    except Exception as e:
        logger.error(f"Error querying student: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error during login")

    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    if not verify_password(request.password, student.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not student.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your account has been deactivated.")

    token = create_access_token(
        data={"sub": str(student.id), "email": student.email, "role": "lead"},
        expires_delta=timedelta(minutes=60),
    )
    return LoginResponse(access_token=token, token_type="bearer", role="lead")


@router.get("/me", response_model=ProfileResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Return the authenticated user's profile (admin or user)."""
    role = "admin" if type(current_user).__name__ == "Admin" else "user"
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=role,
    )


@router.patch("/me/password")
async def change_password(
    payload: ChangePasswordRequest,
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    """Change the authenticated user's password."""
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    current_user.password_hash = hash_password(payload.new_password)
    session.add(current_user)
    await session.commit()
    return {"message": "Password updated"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    """Delete the authenticated user's account. Blocks if last admin."""
    if type(current_user).__name__ == "Admin":
        count_stmt = select(func.count(Admin.id))
        result = await session.execute(count_stmt)
        total = result.scalar() or 0
        if total <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin account.",
            )
    await session.delete(current_user)
    await session.commit()
    return None