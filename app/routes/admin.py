"""Admin-only routes for user approval and management."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.user import Admin, User, PendingApprovalUser
from app.schemas.pending_user import PendingUserResponse, UserResponse, UserStatusUpdate
from app.services.approvals import (
    list_pending_users,
    approve_pending_user,
    reject_pending_user,
    list_users,
    update_user_status,
)
from app.utils.auth import require_role

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

    Lightweight endpoint for UI badges to avoid fetching full lists.
    """
    try:
        pending_users = await list_pending_users(session)
        return {"count": len(pending_users)}
    except Exception as e:
        # Keep failure silent but consistent to avoid breaking UI badges
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
    
    Args:
        user_id: ID of user to update
        status_update: UserStatusUpdate with is_active flag
        session: Database session
        current_user: Authenticated admin user
    
    Returns:
        Updated UserResponse
    
    Raises:
        HTTPException 404 if user not found
    """
    updated_user = await update_user_status(session, user_id, status_update.is_active)
    return updated_user
