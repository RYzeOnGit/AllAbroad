"""Pydantic schemas for student portal."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Student schemas
class StudentResponse(BaseModel):
    """Student profile response."""
    id: int
    lead_id: int
    email: str
    full_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    passport_number: Optional[str] = None
    documents_completed: int = 0
    documents_total: int = 0
    applications_completed: int = 0
    applications_total: int = 0
    visa_stage: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Document schemas
class DocumentCreate(BaseModel):
    """Schema for uploading a document."""
    document_type: str = Field(..., min_length=1, max_length=100)
    file_name: str = Field(..., min_length=1, max_length=255)
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


class DocumentResponse(BaseModel):
    """Document response schema."""
    id: int
    student_id: int
    document_type: str
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    status: str
    counselor_comment: Optional[str] = None
    uploaded_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    
    class Config:
        from_attributes = True


class DocumentUpdate(BaseModel):
    """Schema for updating document (replacing file)."""
    file_name: str = Field(..., min_length=1, max_length=255)
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


# Application schemas
class ApplicationCreate(BaseModel):
    """Schema for creating a university application."""
    university_name: str = Field(..., min_length=1, max_length=255)
    program_name: str = Field(..., min_length=1, max_length=255)
    country: str = Field(..., min_length=1, max_length=100)
    degree_level: str = Field(..., max_length=50)
    intake: str = Field(..., max_length=50)
    application_deadline: Optional[datetime] = None
    scholarship_amount: Optional[float] = None
    scholarship_currency: Optional[str] = Field(default=None, max_length=10)


class ApplicationResponse(BaseModel):
    """Application response schema."""
    id: int
    student_id: int
    university_name: str
    program_name: str
    country: str
    degree_level: str
    intake: str
    status: str
    application_deadline: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    decision_date: Optional[datetime] = None
    scholarship_amount: Optional[float] = None
    scholarship_currency: Optional[str] = None
    ai_suggestions: Optional[str] = None
    counselor_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ApplicationUpdate(BaseModel):
    """Schema for updating application."""
    university_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    program_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    country: Optional[str] = Field(default=None, min_length=1, max_length=100)
    degree_level: Optional[str] = Field(default=None, max_length=50)
    intake: Optional[str] = Field(default=None, max_length=50)
    status: Optional[str] = None
    application_deadline: Optional[datetime] = None
    scholarship_amount: Optional[float] = None
    scholarship_currency: Optional[str] = Field(default=None, max_length=10)
    counselor_notes: Optional[str] = None


# Visa schemas
class VisaCreate(BaseModel):
    """Schema for creating a visa application."""
    country: str = Field(..., min_length=1, max_length=100)
    visa_type: str = Field(..., max_length=50)
    estimated_processing_days: Optional[int] = None


class VisaResponse(BaseModel):
    """Visa response schema."""
    id: int
    student_id: int
    country: str
    visa_type: str
    status: str
    current_stage: Optional[str] = None
    application_submitted_at: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    interview_location: Optional[str] = None
    decision_date: Optional[datetime] = None
    estimated_processing_days: Optional[int] = None
    required_documents: Optional[str] = None
    submitted_documents: Optional[str] = None
    counselor_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class VisaUpdate(BaseModel):
    """Schema for updating visa status."""
    status: Optional[str] = None
    current_stage: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_location: Optional[str] = None
    counselor_notes: Optional[str] = None


# Payment schemas
class PaymentResponse(BaseModel):
    """Payment/invoice response schema."""
    id: int
    student_id: int
    invoice_number: str
    description: str
    amount: float
    currency: str
    status: str
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    is_installment: bool = False
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Message schemas
class MessageCreate(BaseModel):
    """Schema for creating a message."""
    content: str = Field(..., min_length=1)
    sender_type: str = Field(default="student", max_length=20)  # student, counselor, ai
    attachments: Optional[List[str]] = None


class MessageResponse(BaseModel):
    """Message response schema."""
    id: int
    student_id: int
    sender_type: str
    sender_id: Optional[int] = None
    content: str
    is_read: bool
    attachments: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Timeline schemas
class TimelineEventResponse(BaseModel):
    """Timeline event response schema."""
    id: int
    student_id: int
    event_type: str
    category: str
    title: str
    description: Optional[str] = None
    related_document_id: Optional[int] = None
    related_application_id: Optional[int] = None
    related_visa_id: Optional[int] = None
    related_payment_id: Optional[int] = None
    related_message_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Dashboard schemas
class DashboardStats(BaseModel):
    """Dashboard statistics response."""
    documents_progress: dict  # {completed: int, total: int, percentage: float}
    applications_progress: dict  # {completed: int, total: int, percentage: float}
    visa_status: Optional[str] = None
    visa_stage: Optional[str] = None
    pending_payments: int = 0
    overdue_payments: int = 0
    unread_messages: int = 0
    upcoming_deadlines: List[dict] = []  # {type: str, title: str, date: datetime}
    recent_activity: List[TimelineEventResponse] = []


# University comparison schemas
class UniversityComparison(BaseModel):
    """University comparison data."""
    university_name: str
    program_name: str
    country: str
    ranking: Optional[int] = None
    tuition_fee: Optional[float] = None
    currency: Optional[str] = None
    duration: Optional[str] = None
    application_status: Optional[str] = None
    ai_recommendation_score: Optional[float] = None
    highlights: Optional[List[str]] = None

