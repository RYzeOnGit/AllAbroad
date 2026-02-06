"""Student portal database models."""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, DateTime, Relationship
from sqlalchemy import func, Text, LargeBinary


class Student(SQLModel, table=True):
    """Student model - links to Lead for student portal access."""
    
    __tablename__ = "students"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    lead_id: int = Field(foreign_key="leads.id", unique=True, index=True)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    is_active: bool = Field(default=True, index=True)
    
    # Student profile
    full_name: Optional[str] = Field(default=None, max_length=255)
    date_of_birth: Optional[datetime] = None
    passport_number: Optional[str] = Field(default=None, max_length=50)
    
    # Progress tracking
    documents_completed: int = Field(default=0)
    documents_total: int = Field(default=0)
    applications_completed: int = Field(default=0)
    applications_total: int = Field(default=0)
    visa_stage: Optional[str] = Field(default=None, max_length=50)  # not_started, in_progress, submitted, approved, rejected
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class Document(SQLModel, table=True):
    """Document model for student document uploads."""
    
    __tablename__ = "documents"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    document_type: str = Field(max_length=100, index=True)  # passport, transcript, recommendation, etc.
    file_name: str = Field(max_length=255)
    file_path: Optional[str] = Field(default=None, max_length=500)  # Legacy field, kept for migration compatibility
    file_content: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))  # PDF content stored in DB
    file_size: Optional[int] = None  # bytes
    mime_type: Optional[str] = Field(default=None, max_length=100)
    
    status: str = Field(default="pending", max_length=50, index=True)  # pending, approved, rejected, needs_revision
    counselor_comment: Optional[str] = Field(default=None, sa_column=Column(Text))
    uploaded_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class Application(SQLModel, table=True):
    """Application model for university applications."""
    
    __tablename__ = "applications"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    university_name: str = Field(max_length=255, index=True)
    program_name: str = Field(max_length=255)
    country: str = Field(max_length=100, index=True)
    degree_level: str = Field(max_length=50)  # Bachelor's, Master's, PhD
    intake: str = Field(max_length=50)  # Fall 2024, Spring 2025
    
    status: str = Field(default="draft", max_length=50, index=True)  # draft, submitted, under_review, accepted, rejected, deferred, waitlisted
    application_deadline: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    decision_date: Optional[datetime] = None
    
    # Scholarship information
    scholarship_amount: Optional[float] = None
    scholarship_currency: Optional[str] = Field(default=None, max_length=10)
    
    # AI suggestions and notes
    ai_suggestions: Optional[str] = Field(default=None, sa_column=Column(Text))
    counselor_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class Visa(SQLModel, table=True):
    """Visa model for visa application tracking."""
    
    __tablename__ = "visas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    country: str = Field(max_length=100, index=True)
    visa_type: str = Field(max_length=50)  # student, tourist, work
    
    status: str = Field(default="not_started", max_length=50, index=True)  # not_started, documents_preparing, submitted, interview_scheduled, approved, rejected
    current_stage: Optional[str] = Field(default=None, max_length=100)
    
    # Important dates
    application_submitted_at: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    interview_location: Optional[str] = Field(default=None, max_length=255)
    decision_date: Optional[datetime] = None
    estimated_processing_days: Optional[int] = None
    
    # Documents
    required_documents: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON array of document types
    submitted_documents: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON array of document IDs
    
    counselor_notes: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class Payment(SQLModel, table=True):
    """Payment model for tracking fees and invoices."""
    
    __tablename__ = "payments"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    invoice_number: str = Field(max_length=100, unique=True, index=True)
    
    description: str = Field(max_length=255)
    amount: float = Field(index=True)
    currency: str = Field(default="USD", max_length=10)
    
    status: str = Field(default="pending", max_length=50, index=True)  # pending, paid, overdue, cancelled
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = Field(default=None, max_length=50)
    receipt_path: Optional[str] = Field(default=None, max_length=500)
    
    # Payment plan
    is_installment: bool = Field(default=False)
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )


class Message(SQLModel, table=True):
    """Message model for student-counselor and student-AI communication."""
    
    __tablename__ = "messages"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    sender_type: str = Field(max_length=20, index=True)  # student, counselor, ai
    sender_id: Optional[int] = Field(default=None)  # user_id for counselor, null for student/AI
    
    content: str = Field(sa_column=Column(Text))
    is_read: bool = Field(default=False, index=True)
    attachments: Optional[str] = Field(default=None, sa_column=Column(Text))  # JSON array of file paths
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )


class TimelineEvent(SQLModel, table=True):
    """Timeline event model for chronological activity tracking."""
    
    __tablename__ = "timeline_events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id", index=True)
    event_type: str = Field(max_length=50, index=True)  # document_upload, application_submit, payment, visa_update, message
    category: str = Field(max_length=50, index=True)  # documents, applications, visa, payments, communication
    
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # Related entity references
    related_document_id: Optional[int] = Field(default=None, foreign_key="documents.id")
    related_application_id: Optional[int] = Field(default=None, foreign_key="applications.id")
    related_visa_id: Optional[int] = Field(default=None, foreign_key="visas.id")
    related_payment_id: Optional[int] = Field(default=None, foreign_key="payments.id")
    related_message_id: Optional[int] = Field(default=None, foreign_key="messages.id")
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=True), server_default=func.now(), index=True)
    )

