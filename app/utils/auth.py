import bcrypt
from datetime import datetime, timedelta
from email_validator import EmailNotValidError, validate_email
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.config import settings
from app.models.user import User, Admin, PendingApprovalUser
from app.database import get_session

security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode(), hash.encode())

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> dict | None:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    session: AsyncSession = Depends(get_session),
):
    """Verify JWT token and return current admin or user based on role claim."""

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    role = payload.get("role")
    if user_id is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    model = Admin if role == "admin" else User
    statement = select(model).where(model.id == int(user_id))
    result = await session.execute(statement)
    principal = result.scalar_one_or_none()

    if principal is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if isinstance(principal, User) and not principal.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return principal

def require_role(*allowed_roles: str):
    """Dependency to check if user has required role."""
    async def role_checker(current_user = Depends(get_current_user)):
        # Determine role based on model type name
        user_type = type(current_user).__name__
        user_role = "admin" if user_type == "Admin" else "user"
        
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker


async def email_exists_in_any_table(
    session: AsyncSession,
    email: str,
    exclude_table: str = None
) -> bool:
    """Check if email exists in admins, users, or pending_approval_users tables."""
    email = email.lower().strip()
    
    if exclude_table != "admins":
        result = await session.execute(select(Admin).where(Admin.email == email))
        if result.scalar_one_or_none():
            return True
    
    if exclude_table != "users":
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            return True
    
    if exclude_table != "pending_approval_users":
        result = await session.execute(select(PendingApprovalUser).where(PendingApprovalUser.email == email))
        if result.scalar_one_or_none():
            return True
    
    return False

async def send_email_via_resend(
    to: str,
    subject: str,
    html: str,
    from_email: str = "AllAbroad <onboarding@resend.dev>"
) -> bool:
    """Send email via Resend API if configured."""
    try:
        validate_email(to)
    except EmailNotValidError as e:
        print(f"[ERROR] Invalid recipient email: {e}")
        return False

    if not settings.resend_api_key:
        print(f"[INFO] Resend API key not configured. Email not sent to {to}")
        return True

    try:
        from resend import Resend
        client = Resend(api_key=settings.resend_api_key)
        client.emails.send({"from": from_email, "to": to, "subject": subject, "html": html})
        return True
    except Exception as e:
        print(f"[ERROR] Failed to send email: {str(e)}")
        return False