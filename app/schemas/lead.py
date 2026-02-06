"""Pydantic schemas for lead validation."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator
import re

from app.lead_options import CURRENCIES, DEGREES


class LeadCreate(BaseModel):
    """Schema for creating a new lead."""
    
    name: str = Field(..., min_length=2, max_length=255, description="Full name of the lead")
    email: str = Field(..., min_length=5, max_length=255, description="Email address")
    country: str = Field(..., min_length=2, max_length=100, description="Lead's current country")
    target_country: str = Field(..., min_length=2, max_length=100, description="Target study destination")
    intake: str = Field(..., min_length=2, max_length=50, description="Intake period (e.g., Fall 2024)")
    degree: str = Field(..., description="Degree (Bachelor's or Master's for now)")
    subject: str = Field(..., min_length=2, max_length=120, description="Subject of study")
    subject_other: Optional[str] = Field(None, max_length=100, description="Custom subject when subject is Other")
    budget_min: Optional[int] = Field(None, ge=0, description="Tuition fees range minimum (integer)")
    budget_max: Optional[int] = Field(None, ge=0, description="Tuition fees range maximum (integer)")
    budget_currency: str = Field(..., description="Preferred currency (USD, EUR, INR, GBP)")
    source: str = Field(..., min_length=2, max_length=100, description="Lead source")

    @model_validator(mode="after")
    def validate_subject_other(self):
        if self.subject == "Other":
            if not self.subject_other or not str(self.subject_other).strip():
                raise ValueError("Please specify your subject when choosing Other")
        return self

    @model_validator(mode="after")
    def validate_budget_range(self):
        if self.budget_min is None and self.budget_max is None:
            raise ValueError("Please provide at least a minimum or maximum tuition amount")
        if self.budget_min is not None and self.budget_max is not None and self.budget_min > self.budget_max:
            raise ValueError("Minimum tuition cannot be greater than maximum")
        return self

    @field_validator("degree")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        d = v.strip()
        if d not in DEGREES:
            raise ValueError(
                "We currently only support Bachelor's and Master's programs. "
                "PhD, Diploma, and other degrees are coming soon. Thank you for your patience."
            )
        return d

    @field_validator("budget_currency")
    @classmethod
    def validate_budget_currency(cls, v: str) -> str:
        c = v.strip().upper()
        if c not in CURRENCIES:
            raise ValueError(f"Currency must be one of: {', '.join(CURRENCIES)}")
        return c

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
    
    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format (format only; no Resend/automated verification)."""
        email = v.strip().lower()
        if not email:
            raise ValueError("Email cannot be empty")
        if len(email) < 5 or len(email) > 255:
            raise ValueError("Please enter a valid email address")
        if "@" not in email or "." not in email.split("@")[-1]:
            raise ValueError("Please enter a valid email address")
        if re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email) is None:
            raise ValueError("Please enter a valid email address")
        return email
    
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
    email: str
    country: str
    target_country: str
    intake: str
    degree: Optional[str] = None
    subject: Optional[str] = None
    budget: Optional[str] = None
    budget_amount: Optional[int] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    budget_currency: Optional[str] = None
    source: str
    created_at: datetime
    status: str
    version: int = 0  # Optimistic locking version

    class Config:
        from_attributes = True

