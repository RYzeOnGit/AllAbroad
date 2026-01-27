"""User database models."""
from datetime import datetime
from typing import Optional
from sqlalchemy import func
from sqlmodel import SQLModel, Field, Column, DateTime


class Admin(SQLModel, table=True):
    """Admin model for admin staff authentication."""

    __tablename__ = "admins"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    full_name: str = Field(max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )


class User(SQLModel, table=True):
    """User model for approved staff authentication."""

    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    full_name: str = Field(max_length=255)
    password_hash: str = Field(max_length=255)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )


class PendingApprovalUser(SQLModel, table=True):
    """PendingApprovalUser model for signup approval workflow."""

    __tablename__ = "pending_approval_users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(max_length=255, unique=True, index=True)
    full_name: str = Field(max_length=255)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now()),
    )
