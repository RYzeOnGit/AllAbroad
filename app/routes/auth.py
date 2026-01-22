from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.utils.auth import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_session)):
    """Staff login endpoint."""
    # Find user by email
    statement = select(User).where(User.email == request.email)
    result = await session.execute(statement)
    user = result.scalar_one_or_none()
    
    # Check if user exists and password is correct
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role
    )