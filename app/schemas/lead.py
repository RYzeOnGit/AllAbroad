"""Pydantic schemas for lead validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re


class LeadCreate(BaseModel):
    """Schema for creating a new lead."""
    
    name: str = Field(..., min_length=2, max_length=255, description="Full name of the lead")
    phone: str = Field(..., min_length=5, max_length=50, description="Phone number")
    country: str = Field(..., min_length=2, max_length=100, description="Lead's current country")
    target_country: str = Field(..., min_length=2, max_length=100, description="Target study destination")
    intake: str = Field(..., min_length=2, max_length=50, description="Intake period (e.g., Fall 2024)")
    budget: Optional[str] = Field(None, max_length=50, description="Budget range")
    source: str = Field(..., min_length=2, max_length=100, description="Lead source")
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate and clean name."""
        name = v.strip()
        if not name or len(name) < 2:
            raise ValueError("Name must be at least 2 characters long")
        # Remove excessive whitespace
        name = re.sub(r"\s+", " ", name)
        return name
    
    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        """Basic phone validation - will be normalized later."""
        phone = v.strip()
        if not phone:
            raise ValueError("Phone number cannot be empty")
        # Remove common separators for initial validation
        cleaned = re.sub(r"[\s\-\(\)\.]", "", phone)
        if len(cleaned) < 5:
            raise ValueError("Phone number appears too short")
        return phone
    
    @field_validator("country", "target_country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        """Validate country name."""
        country = v.strip()
        if not country or len(country) < 2:
            raise ValueError("Country name must be at least 2 characters")
        return country
    
    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        """Validate and normalize source."""
        source = v.strip().lower()
        if not source:
            raise ValueError("Source cannot be empty")
        return source


class LeadResponse(BaseModel):
    """Schema for lead response."""
    
    id: int
    name: str
    phone: str
    country: str
    target_country: str
    intake: str
    budget: Optional[str]
    source: str
    created_at: datetime
    status: str
    
    class Config:
        from_attributes = True

