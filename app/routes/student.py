"""Student portal API endpoints."""
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.student import (
    Student, Document, Application, Visa, Payment, Message, TimelineEvent
)
from app.models.lead import Lead
from app.schemas.student import (
    StudentResponse,
    DocumentCreate, DocumentResponse, DocumentUpdate,
    ApplicationCreate, ApplicationResponse, ApplicationUpdate,
    VisaCreate, VisaResponse, VisaUpdate,
    PaymentResponse,
    MessageCreate, MessageResponse,
    TimelineEventResponse,
    DashboardStats, UniversityComparison
)
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/student", tags=["student"])

# File upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def get_current_student(session: AsyncSession = Depends(get_session), current_user: User = Depends(get_current_user)) -> Student:
    """Get current student from authenticated user (assuming user is linked to student via lead)."""
    # For now, find student by email matching user email
    # In production, you'd have a proper user-student relationship
    statement = select(Student).where(Student.email == current_user.email)
    result = await session.execute(statement)
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


# Dashboard
@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Get dashboard statistics and overview."""
    # Documents progress
    doc_stmt = select(func.count(Document.id)).where(Document.student_id == student.id)
    doc_result = await session.execute(doc_stmt)
    total_docs = doc_result.scalar() or 0
    
    approved_docs_stmt = select(func.count(Document.id)).where(
        Document.student_id == student.id,
        Document.status == "approved"
    )
    approved_docs_result = await session.execute(approved_docs_stmt)
    completed_docs = approved_docs_result.scalar() or 0
    
    # Applications progress
    app_stmt = select(func.count(Application.id)).where(Application.student_id == student.id)
    app_result = await session.execute(app_stmt)
    total_apps = app_result.scalar() or 0
    
    submitted_apps_stmt = select(func.count(Application.id)).where(
        Application.student_id == student.id,
        Application.status.in_(["submitted", "under_review", "accepted"])
    )
    submitted_apps_result = await session.execute(submitted_apps_stmt)
    completed_apps = submitted_apps_result.scalar() or 0
    
    # Visa status
    visa_stmt = select(Visa).where(Visa.student_id == student.id).order_by(Visa.created_at.desc())
    visa_result = await session.execute(visa_stmt)
    visa = visa_result.scalar_one_or_none()
    
    # Payments
    pending_payments_stmt = select(func.count(Payment.id)).where(
        Payment.student_id == student.id,
        Payment.status == "pending",
        Payment.due_date >= datetime.utcnow()
    )
    pending_result = await session.execute(pending_payments_stmt)
    pending_payments = pending_result.scalar() or 0
    
    overdue_payments_stmt = select(func.count(Payment.id)).where(
        Payment.student_id == student.id,
        Payment.status.in_(["pending", "overdue"]),
        Payment.due_date < datetime.utcnow()
    )
    overdue_result = await session.execute(overdue_payments_stmt)
    overdue_payments = overdue_result.scalar() or 0
    
    # Unread messages
    unread_stmt = select(func.count(Message.id)).where(
        Message.student_id == student.id,
        Message.is_read == False,
        Message.sender_type != "student"
    )
    unread_result = await session.execute(unread_stmt)
    unread_messages = unread_result.scalar() or 0
    
    # Upcoming deadlines
    deadlines = []
    app_deadlines_stmt = select(Application).where(
        Application.student_id == student.id,
        Application.application_deadline.isnot(None),
        Application.application_deadline >= datetime.utcnow()
    ).order_by(Application.application_deadline).limit(5)
    app_deadlines_result = await session.execute(app_deadlines_stmt)
    for app in app_deadlines_result.scalars():
        deadlines.append({
            "type": "application",
            "title": f"{app.university_name} - {app.program_name}",
            "date": app.application_deadline
        })
    
    if visa and visa.interview_date and visa.interview_date >= datetime.utcnow():
        deadlines.append({
            "type": "visa_interview",
            "title": f"Visa Interview - {visa.country}",
            "date": visa.interview_date
        })
    
    # Recent activity (last 10 timeline events)
    timeline_stmt = select(TimelineEvent).where(
        TimelineEvent.student_id == student.id
    ).order_by(TimelineEvent.created_at.desc()).limit(10)
    timeline_result = await session.execute(timeline_stmt)
    recent_activity = [TimelineEventResponse.model_validate(e) for e in timeline_result.scalars()]
    
    return DashboardStats(
        documents_progress={
            "completed": completed_docs,
            "total": max(total_docs, student.documents_total) or 10,  # Default to 10 if not set
            "percentage": round((completed_docs / max(total_docs, student.documents_total, 1)) * 100, 1)
        },
        applications_progress={
            "completed": completed_apps,
            "total": total_apps or student.applications_total or 0,
            "percentage": round((completed_apps / max(total_apps, student.applications_total, 1)) * 100, 1) if total_apps > 0 else 0
        },
        visa_status=visa.status if visa else None,
        visa_stage=visa.current_stage if visa else None,
        pending_payments=pending_payments,
        overdue_payments=overdue_payments,
        unread_messages=unread_messages,
        upcoming_deadlines=deadlines,
        recent_activity=recent_activity
    )


# Documents
@router.get("/documents", response_model=List[DocumentResponse])
async def get_documents(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student),
    document_type: Optional[str] = None
):
    """Get all documents for the student."""
    statement = select(Document).where(Document.student_id == student.id)
    if document_type:
        statement = statement.where(Document.document_type == document_type)
    statement = statement.order_by(Document.uploaded_at.desc())
    result = await session.execute(statement)
    return [DocumentResponse.model_validate(d) for d in result.scalars()]


@router.post("/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Upload a document."""
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{student.id}_{datetime.utcnow().timestamp()}_{file.filename}")
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create document record
    document = Document(
        student_id=student.id,
        document_type=document_type,
        file_name=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        status="pending"
    )
    session.add(document)
    
    # Create timeline event
    timeline_event = TimelineEvent(
        student_id=student.id,
        event_type="document_upload",
        category="documents",
        title=f"Uploaded {document_type}",
        description=f"File: {file.filename}",
        related_document_id=None  # Will be set after commit
    )
    session.add(timeline_event)
    
    await session.commit()
    await session.refresh(document)
    
    # Update timeline event with document ID
    timeline_event.related_document_id = document.id
    await session.commit()
    await session.refresh(document)
    
    return DocumentResponse.model_validate(document)


@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Get a specific document."""
    statement = select(Document).where(
        Document.id == document_id,
        Document.student_id == student.id
    )
    result = await session.execute(statement)
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(document)


@router.patch("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Replace/update a document."""
    statement = select(Document).where(
        Document.id == document_id,
        Document.student_id == student.id
    )
    result = await session.execute(statement)
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete old file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Save new file
    file_path = os.path.join(UPLOAD_DIR, f"{student.id}_{datetime.utcnow().timestamp()}_{file.filename}")
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Update document
    document.file_name = file.filename
    document.file_path = file_path
    document.file_size = len(content)
    document.mime_type = file.content_type
    document.status = "pending"  # Reset to pending for review
    
    # Create timeline event
    timeline_event = TimelineEvent(
        student_id=student.id,
        event_type="document_upload",
        category="documents",
        title=f"Updated {document.document_type}",
        description=f"Replaced with: {file.filename}",
        related_document_id=document.id
    )
    session.add(timeline_event)
    
    await session.commit()
    await session.refresh(document)
    
    return DocumentResponse.model_validate(document)


@router.get("/documents/checklist")
async def get_document_checklist(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Get required documents checklist."""
    required_docs = [
        "passport",
        "transcript",
        "diploma",
        "recommendation_letter_1",
        "recommendation_letter_2",
        "statement_of_purpose",
        "english_proficiency",
        "financial_statement"
    ]
    
    statement = select(Document).where(
        Document.student_id == student.id,
        Document.document_type.in_(required_docs)
    )
    result = await session.execute(statement)
    uploaded_docs = {d.document_type: d for d in result.scalars()}
    
    checklist = []
    for doc_type in required_docs:
        doc = uploaded_docs.get(doc_type)
        checklist.append({
            "document_type": doc_type,
            "display_name": doc_type.replace("_", " ").title(),
            "uploaded": doc is not None,
            "status": doc.status if doc else None,
            "uploaded_at": doc.uploaded_at if doc else None,
            "counselor_comment": doc.counselor_comment if doc else None
        })
    
    return {"checklist": checklist}


# Applications
@router.get("/applications", response_model=List[ApplicationResponse])
async def get_applications(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student),
    status_filter: Optional[str] = None
):
    """Get all applications for the student."""
    statement = select(Application).where(Application.student_id == student.id)
    if status_filter:
        statement = statement.where(Application.status == status_filter)
    statement = statement.order_by(Application.created_at.desc())
    result = await session.execute(statement)
    return [ApplicationResponse.model_validate(a) for a in result.scalars()]


@router.post("/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_data: ApplicationCreate,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Create a new university application."""
    application = Application(
        student_id=student.id,
        **application_data.model_dump()
    )
    session.add(application)
    
    # Create timeline event
    timeline_event = TimelineEvent(
        student_id=student.id,
        event_type="application_created",
        category="applications",
        title=f"Created application: {application.university_name}",
        description=f"Program: {application.program_name}",
        related_application_id=None
    )
    session.add(timeline_event)
    
    await session.commit()
    await session.refresh(application)
    
    timeline_event.related_application_id = application.id
    await session.commit()
    await session.refresh(application)
    
    return ApplicationResponse.model_validate(application)


@router.get("/applications/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Get a specific application."""
    statement = select(Application).where(
        Application.id == application_id,
        Application.student_id == student.id
    )
    result = await session.execute(statement)
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return ApplicationResponse.model_validate(application)


@router.patch("/applications/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: int,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Submit an application (change status to submitted)."""
    statement = select(Application).where(
        Application.id == application_id,
        Application.student_id == student.id
    )
    result = await session.execute(statement)
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.status == "submitted":
        raise HTTPException(status_code=400, detail="Application already submitted")
    
    application.status = "submitted"
    application.submitted_at = datetime.utcnow()
    
    # Create timeline event
    timeline_event = TimelineEvent(
        student_id=student.id,
        event_type="application_submit",
        category="applications",
        title=f"Submitted application: {application.university_name}",
        description=f"Program: {application.program_name}",
        related_application_id=application.id
    )
    session.add(timeline_event)
    
    await session.commit()
    await session.refresh(application)
    
    return ApplicationResponse.model_validate(application)


# Visa
@router.get("/visa", response_model=Optional[VisaResponse])
async def get_visa(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Get visa application for the student."""
    statement = select(Visa).where(Visa.student_id == student.id).order_by(Visa.created_at.desc())
    result = await session.execute(statement)
    visa = result.scalar_one_or_none()
    if not visa:
        return None
    return VisaResponse.model_validate(visa)


@router.post("/visa", response_model=VisaResponse, status_code=status.HTTP_201_CREATED)
async def create_visa(
    visa_data: VisaCreate,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Create a visa application."""
    visa = Visa(
        student_id=student.id,
        **visa_data.model_dump()
    )
    session.add(visa)
    
    # Create timeline event
    timeline_event = TimelineEvent(
        student_id=student.id,
        event_type="visa_created",
        category="visa",
        title=f"Started visa application: {visa.country}",
        description=f"Visa type: {visa.visa_type}",
        related_visa_id=None
    )
    session.add(timeline_event)
    
    await session.commit()
    await session.refresh(visa)
    
    timeline_event.related_visa_id = visa.id
    await session.commit()
    await session.refresh(visa)
    
    return VisaResponse.model_validate(visa)


@router.patch("/visa/{visa_id}", response_model=VisaResponse)
async def update_visa(
    visa_id: int,
    visa_update: VisaUpdate,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Update visa application."""
    statement = select(Visa).where(
        Visa.id == visa_id,
        Visa.student_id == student.id
    )
    result = await session.execute(statement)
    visa = result.scalar_one_or_none()
    if not visa:
        raise HTTPException(status_code=404, detail="Visa application not found")
    
    for key, value in visa_update.model_dump(exclude_unset=True).items():
        setattr(visa, key, value)
    
    # Create timeline event if status changed
    if visa_update.status:
        timeline_event = TimelineEvent(
            student_id=student.id,
            event_type="visa_update",
            category="visa",
            title=f"Visa status updated: {visa_update.status}",
            description=f"Stage: {visa_update.current_stage or visa.current_stage}",
            related_visa_id=visa.id
        )
        session.add(timeline_event)
    
    await session.commit()
    await session.refresh(visa)
    
    return VisaResponse.model_validate(visa)


# Payments
@router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student),
    status_filter: Optional[str] = None
):
    """Get all payments/invoices for the student."""
    statement = select(Payment).where(Payment.student_id == student.id)
    if status_filter:
        statement = statement.where(Payment.status == status_filter)
    statement = statement.order_by(Payment.due_date.desc(), Payment.created_at.desc())
    result = await session.execute(statement)
    return [PaymentResponse.model_validate(p) for p in result.scalars()]


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Get a specific payment/invoice."""
    statement = select(Payment).where(
        Payment.id == payment_id,
        Payment.student_id == student.id
    )
    result = await session.execute(statement)
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return PaymentResponse.model_validate(payment)


# Messages
@router.get("/messages", response_model=List[MessageResponse])
async def get_messages(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student),
    unread_only: bool = False
):
    """Get messages for the student."""
    statement = select(Message).where(Message.student_id == student.id)
    if unread_only:
        statement = statement.where(Message.is_read == False)
    statement = statement.order_by(Message.created_at.asc())  # Chronological order (oldest first) for chat view
    result = await session.execute(statement)
    return [MessageResponse.model_validate(m) for m in result.scalars()]


@router.post("/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: MessageCreate,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Send a message (to counselor or AI)."""
    message = Message(
        student_id=student.id,
        sender_type="student",
        content=message_data.content,
        attachments=json.dumps(message_data.attachments) if message_data.attachments else None
    )
    session.add(message)
    
    # Create timeline event
    timeline_event = TimelineEvent(
        student_id=student.id,
        event_type="message",
        category="communication",
        title="Sent message",
        description=message_data.content[:100],
        related_message_id=None
    )
    session.add(timeline_event)
    
    await session.commit()
    await session.refresh(message)
    
    timeline_event.related_message_id = message.id
    await session.commit()
    await session.refresh(message)
    
    return MessageResponse.model_validate(message)


@router.patch("/messages/{message_id}/read", response_model=MessageResponse)
async def mark_message_read(
    message_id: int,
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student)
):
    """Mark a message as read."""
    statement = select(Message).where(
        Message.id == message_id,
        Message.student_id == student.id
    )
    result = await session.execute(statement)
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = True
    await session.commit()
    await session.refresh(message)
    
    return MessageResponse.model_validate(message)


# Timeline
@router.get("/timeline", response_model=List[TimelineEventResponse])
async def get_timeline(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student),
    category: Optional[str] = None,
    limit: int = 50
):
    """Get timeline events for the student."""
    statement = select(TimelineEvent).where(TimelineEvent.student_id == student.id)
    if category:
        statement = statement.where(TimelineEvent.category == category)
    statement = statement.order_by(TimelineEvent.created_at.desc()).limit(limit)
    result = await session.execute(statement)
    return [TimelineEventResponse.model_validate(e) for e in result.scalars()]


# University Comparison
@router.get("/applications/compare", response_model=List[UniversityComparison])
async def compare_universities(
    session: AsyncSession = Depends(get_session),
    student: Student = Depends(get_current_student),
    application_ids: Optional[str] = None  # Comma-separated IDs
):
    """Get comparison data for selected applications."""
    if not application_ids:
        # Get all applications
        statement = select(Application).where(Application.student_id == student.id)
    else:
        ids = [int(x) for x in application_ids.split(",")]
        statement = select(Application).where(
            Application.id.in_(ids),
            Application.student_id == student.id
        )
    
    result = await session.execute(statement)
    applications = result.scalars().all()
    
    comparisons = []
    for app in applications:
        # Calculate AI recommendation score (simplified - in production, use actual AI)
        score = 85.0  # Placeholder
        if app.status == "accepted":
            score = 95.0
        elif app.status == "under_review":
            score = 90.0
        
        comparisons.append(UniversityComparison(
            university_name=app.university_name,
            program_name=app.program_name,
            country=app.country,
            ranking=None,  # Would come from university database
            tuition_fee=None,  # Would come from university database
            currency=None,
            duration=None,
            application_status=app.status,
            ai_recommendation_score=score,
            highlights=[
                f"Status: {app.status}",
                f"Intake: {app.intake}",
                f"Degree: {app.degree_level}"
            ]
        ))
    
    return comparisons

