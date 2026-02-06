"""Admin-only routes for user approval and management."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.user import Admin, User, PendingApprovalUser
from app.models.student import Student, Message, Document
from app.schemas.student import DocumentResponse, StudentResponse
from app.schemas.pending_user import PendingUserResponse, UserResponse, UserStatusUpdate
from app.schemas.student import MessageCreate, MessageResponse
from app.services.approvals import (
    list_pending_users,
    count_pending_users,
    approve_pending_user,
    reject_pending_user,
    list_users,
    update_user_status,
    delete_user,
)
from app.utils.auth import require_role
from app.utils.count_cache import get_cached, invalidate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending-users", response_model=list[PendingUserResponse])
async def get_pending_users(
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """
    List all pending approval users (admin only).
    
    Args:
        session: Database session
        current_user: Authenticated admin user
    
    Returns:
        List of PendingUserResponse objects
    """
    pending_users = await list_pending_users(session)
    return pending_users


@router.get("/pending-users/count")
async def get_pending_users_count(
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """
    Return the count of users pending approval (admin only).

    Uses COUNT(*) and a short TTL cache to avoid repeated DB load from polling.
    Cache is invalidated on approve, reject, and signup.
    """
    try:
        n = await get_cached("pending_users", count_pending_users(session), ttl=5)
        return {"count": n}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve pending count: {str(e)}",
        )


@router.post("/pending-users/{pending_user_id}/approve", response_model=UserResponse)
async def approve_user(
    pending_user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """
    Approve a pending user and move to users table (admin only).
    
    Args:
        pending_user_id: ID of pending user to approve
        session: Database session
        current_user: Authenticated admin user
    
    Returns:
        UserResponse for newly approved user
    
    Raises:
        HTTPException 404 if pending user not found
        HTTPException 400 if email already in use
    """
    approved_user = await approve_pending_user(session, pending_user_id)
    invalidate("pending_users")
    return approved_user


@router.delete("/pending-users/{pending_user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_user(
    pending_user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """
    Reject and delete a pending user (admin only).
    
    Args:
        pending_user_id: ID of pending user to reject
        session: Database session
        current_user: Authenticated admin user
    
    Raises:
        HTTPException 404 if pending user not found
    """
    await reject_pending_user(session, pending_user_id)
    invalidate("pending_users")
    return None


@router.get("/users", response_model=list[UserResponse])
async def get_users(
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """
    List all approved users (admin only).
    
    Args:
        session: Database session
        current_user: Authenticated admin user
    
    Returns:
        List of UserResponse objects
    """
    users = await list_users(session)
    return users


@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def update_user_active_status(
    user_id: int,
    status_update: UserStatusUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """
    Update user active/inactive status (admin only).
    Deactivated users get 401 on next request and cannot sign in until reactivated.
    """
    updated_user = await update_user_status(session, user_id, status_update.is_active)
    return updated_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_approved_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Delete an approved user (admin only). Deleted users cannot sign in."""
    await delete_user(session, user_id)
    return None


# Messaging routes
@router.get("/messages/conversations")
async def get_conversations(
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Get all student conversations with unread message counts (admin only)."""
    # Get all students who have messages
    from sqlalchemy import case
    
    statement = select(
        Student.id,
        Student.email,
        Student.full_name,
        func.count(Message.id).label("total_messages"),
        func.sum(case((Message.is_read == False, 1), else_=0)).label("unread_count"),
        func.max(Message.created_at).label("last_message_at")
    ).join(
        Message, Student.id == Message.student_id
    ).group_by(
        Student.id, Student.email, Student.full_name
    ).order_by(
        func.max(Message.created_at).desc()
    )
    
    result = await session.execute(statement)
    conversations = []
    for row in result.all():
        conversations.append({
            "student_id": row.id,
            "student_email": row.email,
            "student_name": row.full_name or row.email,
            "total_messages": row.total_messages or 0,
            "unread_count": int(row.unread_count or 0)
        })
    
    return {"conversations": conversations}


@router.get("/messages/unread-count")
async def get_unread_messages_count(
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Get total count of unread messages from students (admin only)."""
    statement = select(func.count(Message.id)).where(
        Message.sender_type == "student",
        Message.is_read == False
    )
    result = await session.execute(statement)
    count = result.scalar() or 0
    return {"count": count}


@router.get("/messages/student/{student_id}", response_model=List[MessageResponse])
async def get_student_messages(
    student_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Get all messages for a specific student (admin only)."""
    # Verify student exists
    student_stmt = select(Student).where(Student.id == student_id)
    student_result = await session.execute(student_stmt)
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all messages for this student
    statement = select(Message).where(
        Message.student_id == student_id
    ).order_by(Message.created_at.asc())
    
    result = await session.execute(statement)
    messages = [MessageResponse.model_validate(m) for m in result.scalars()]
    
    return messages


@router.post("/messages/student/{student_id}/reply", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def reply_to_student(
    student_id: int,
    message_data: MessageCreate,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Send a reply message to a student (admin only)."""
    # Verify student exists
    student_stmt = select(Student).where(Student.id == student_id)
    student_result = await session.execute(student_stmt)
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Create message from admin (counselor)
    message = Message(
        student_id=student_id,
        sender_type="counselor",
        sender_id=current_user.id,
        content=message_data.content,
        attachments=None  # Admin replies don't support attachments for now
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    
    return MessageResponse.model_validate(message)


@router.patch("/messages/{message_id}/read", response_model=MessageResponse)
async def mark_message_read(
    message_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Mark a message as read (admin only)."""
    statement = select(Message).where(Message.id == message_id)
    result = await session.execute(statement)
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = True
    await session.commit()
    await session.refresh(message)
    
    return MessageResponse.model_validate(message)


@router.patch("/messages/student/{student_id}/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_student_messages_read(
    student_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Mark all unread messages from a student as read (admin only)."""
    # Verify student exists
    student_stmt = select(Student).where(Student.id == student_id)
    student_result = await session.execute(student_stmt)
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update all unread messages from this student
    statement = select(Message).where(
        Message.student_id == student_id,
        Message.sender_type == "student",
        Message.is_read == False
    )
    result = await session.execute(statement)
    messages = result.scalars().all()
    
    for msg in messages:
        msg.is_read = True
    
    await session.commit()
    
    return {"marked_read": len(messages)}


# Document access routes
@router.get("/students/{student_id}/documents", response_model=List[DocumentResponse])
async def get_student_documents(
    student_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Get all documents for a specific student (admin only)."""
    # Verify student exists
    student_stmt = select(Student).where(Student.id == student_id)
    student_result = await session.execute(student_stmt)
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get all documents for this student
    statement = select(Document).where(
        Document.student_id == student_id
    ).order_by(Document.uploaded_at.desc())
    
    result = await session.execute(statement)
    documents = [DocumentResponse.model_validate(d) for d in result.scalars()]
    
    return documents


@router.get("/students/{student_id}/documents/{document_id}/download")
async def download_student_document(
    student_id: int,
    document_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Download/view a student's document (admin only)."""
    # Verify student exists
    student_stmt = select(Student).where(Student.id == student_id)
    student_result = await session.execute(student_stmt)
    student = student_result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get document
    statement = select(Document).where(
        Document.id == document_id,
        Document.student_id == student_id
    )
    result = await session.execute(statement)
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    from fastapi.responses import Response
    
    # Get file content from database
    if not document.file_content:
        raise HTTPException(status_code=404, detail="File content not found")
    
    file_content = document.file_content
    
    return Response(
        content=file_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{document.file_name}"'
        }
    )


@router.get("/students", response_model=List[StudentResponse])
async def get_all_students(
    session: AsyncSession = Depends(get_session),
    current_user: Admin = Depends(require_role("admin"))
):
    """Get all students (admin only)."""
    statement = select(Student).order_by(Student.created_at.desc())
    result = await session.execute(statement)
    students = [StudentResponse.model_validate(s) for s in result.scalars()]
    return students
