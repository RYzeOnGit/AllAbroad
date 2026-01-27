from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.database import get_session
from app.models.user import Admin, PendingApprovalUser, User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    SignupRequest,
)
from app.services import approvals
from app.utils.auth import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, session: AsyncSession = Depends(get_session)):
    """Register a user into the pending approvals table."""
    await approvals.create_pending_user(session, payload)
    return {"message": "Signup received. Await admin approval."}


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_session)):
    """Login endpoint that prefers admin accounts, then users."""
    email = request.email.lower().strip()

    admin_stmt = select(Admin).where(Admin.email == email)
    admin_res = await session.execute(admin_stmt)
    admin = admin_res.scalar_one_or_none()
    if admin and verify_password(request.password, admin.password_hash):
        token = create_access_token(
            data={"sub": str(admin.id), "email": admin.email, "role": "admin"},
            expires_delta=timedelta(minutes=60),
        )
        return LoginResponse(access_token=token, token_type="bearer", role="admin")

    user_stmt = select(User).where(User.email == email)
    user_res = await session.execute(user_stmt)
    user = user_res.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": "user"},
        expires_delta=timedelta(minutes=60),
    )
    return LoginResponse(access_token=token, token_type="bearer", role="user")