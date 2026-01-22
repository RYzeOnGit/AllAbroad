"""User database model."""
from datetime import datetime
from typing import Optional
from sqlalchemy import func
from sqlmodel import SQLModel, Field, Column, DateTime


class User(SQLModel, table=True):
    """User model for internal staff authentication."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    role: str = Field(default="admin", max_length=50, index=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )
