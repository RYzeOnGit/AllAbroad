"""Lead database model."""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, DateTime
from sqlalchemy import func


class Lead(SQLModel, table=True):
    """Lead model for storing study-abroad inquiries."""
    
    __tablename__ = "leads"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=255, index=False)
    phone: str = Field(max_length=50, index=True, unique=True)
    country: str = Field(max_length=100, index=False)
    target_country: str = Field(max_length=100, index=False)
    intake: str = Field(max_length=50, index=False)  # e.g., "Fall 2024", "Spring 2025"
    budget: Optional[str] = Field(default=None, max_length=50, index=False)
    source: str = Field(max_length=100, index=False)  # e.g., "website", "facebook", "referral"
    
    # Row-level security: each lead belongs to a user
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    
    # Optimistic locking: prevent race conditions on concurrent updates
    version: int = Field(default=0, index=False)
    
    # Metadata
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )
    
    # Future extensibility for lead scoring
    score: Optional[float] = Field(default=None, index=True)
    status: str = Field(default="new", max_length=50, index=True)  # new, contacted, qualified, etc.

