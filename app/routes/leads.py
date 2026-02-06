"""Lead submission and management endpoints."""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy import func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.lead_options import SUBJECTS
from app.models.lead import Lead
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadResponse
from app.utils.validation import validate_lead_data
from app.utils.auth import get_current_user, require_role
from app.utils.count_cache import get_cached, invalidate

router = APIRouter(tags=["leads"])

# #region agent log
import os
LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".cursor", "debug.log")
def _debug_log(location, message, data, hypothesis_id):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":hypothesis_id,"location":location,"message":message,"data":data,"timestamp":int(datetime.now().timestamp()*1000)}) + "\n")
    except:  # pragma: no cover - defensive logging
        pass
# #endregion


@router.post(
    "/leads",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new lead",
    description="Capture and store a new study-abroad lead with validation and duplicate prevention. PUBLIC endpoint - no authentication required."
)
async def create_lead(
    lead_data: LeadCreate,
    request: Request,
    session: AsyncSession = Depends(get_session)
) -> LeadResponse:
    """
    Create a new lead.
    
    Validates input, validates email format, checks for duplicates,
    and stores the lead in the database.
    """
    # #region agent log
    _debug_log("app/routes/leads.py:20", "POST /api/leads endpoint called", {"path": str(request.url), "method": request.method, "client": str(request.client)}, "C")
    _debug_log("app/routes/leads.py:20", "Lead data received", {"name": lead_data.name, "email": lead_data.email, "country": lead_data.country}, "C")
    # #endregion
    try:
        # Validate and normalize email (format only; no Resend/automated verification)
        normalized_name, normalized_email = validate_lead_data(
            lead_data.name,
            lead_data.email
        )
        
        # Check for duplicate email
        statement = select(Lead).where(Lead.email == normalized_email)
        result = await session.execute(statement)
        existing_lead = result.scalar_one_or_none()
        
        if existing_lead:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A lead with this email address already exists"
            )
        
        # Resolve subject: use subject_other when subject is "Other"
        resolved_subject = (
            (lead_data.subject_other or "").strip()
            if (lead_data.subject and lead_data.subject.strip() == "Other")
            else (lead_data.subject or "").strip()
        )

        # Create new lead
        new_lead = Lead(
            name=normalized_name,
            email=normalized_email,
            country=lead_data.country.strip(),
            target_country=lead_data.target_country.strip(),
            intake=lead_data.intake.strip(),
            degree=lead_data.degree.strip(),
            subject=resolved_subject,
            budget=None,
            budget_amount=None,
            budget_min=lead_data.budget_min,
            budget_max=lead_data.budget_max,
            budget_currency=lead_data.budget_currency.strip().upper(),
            source=lead_data.source.strip().lower(),
            status="new"
        )
        
        session.add(new_lead)
        await session.commit()
        await session.refresh(new_lead)
        invalidate("new_leads")
        # #region agent log
        _debug_log("app/routes/leads.py:64", "Lead created successfully", {"lead_id": new_lead.id if hasattr(new_lead, 'id') else None}, "C")
        # #endregion
        return LeadResponse.model_validate(new_lead)
    
    except HTTPException as e:
        # #region agent log
        _debug_log("app/routes/leads.py:66", "HTTPException raised", {"status": e.status_code, "detail": e.detail}, "C")
        # #endregion
        raise
    except ValueError as e:
        # #region agent log
        _debug_log("app/routes/leads.py:71", "ValueError in lead creation", {"error": str(e)}, "C")
        # #endregion
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # #region agent log
        _debug_log("app/routes/leads.py:77", "Unexpected error in lead creation", {"error_type": type(e).__name__, "error": str(e)}, "C")
        # #endregion
        # Log error in production
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )


@router.get(
    "/v1/leads",
    summary="Get paginated leads",
    description="Retrieve leads with pagination and optional status filter. PROTECTED - requires staff authentication."
)
async def get_leads(
    page: int | None = Query(None, ge=1, description="Page number (1-based)"),
    page_size: int | None = Query(None, ge=1, le=1000, description="Number of items per page"),
    status_filter: str | None = Query(None, description="Optional status filter"),
    degree: str | None = Query(None, description="Filter by degree"),
    subject: str | None = Query(None, description="Filter by subject"),
    subject_other: str | None = Query(None, description="When subject=Other, filter by custom subject (partial, case-insensitive)"),
    session: AsyncSession = Depends(get_session),
    current_user = Depends(require_role("admin", "user")),
):
    """
    Get leads with pagination (protected - requires authentication).

    Admins see all leads; users see only their leads.
    """
    # Set defaults if not provided
    page = page or 1
    page_size = page_size or 20
    # #region agent log
    _debug_log(
        "app/routes/leads.py:110",
        "GET /api/v1/leads called",
        {"user_id": current_user.id, "page": page, "page_size": page_size, "status": status_filter, "degree": degree, "subject": subject},
        "C",
    )
    # #endregion

    try:
        # Admins see all leads; approved users see unassigned leads (user_id IS NULL) or leads assigned to them
        is_admin = type(current_user).__name__ == "Admin"
        base_query = select(Lead)
        
        if not is_admin:
            base_query = base_query.where(
                or_(Lead.user_id.is_(None), Lead.user_id == current_user.id)
            )
        
        if status_filter:
            base_query = base_query.where(Lead.status == status_filter)
        if degree:
            base_query = base_query.where(Lead.degree == degree)
        if subject:
            if subject.strip() == "Other":
                # "Other" leads are stored with the custom subject_other value (e.g. Psychology), not "Other".
                # Match leads whose subject is not one of the predefined non-Other options.
                predefined_non_other = [s for s in SUBJECTS if s != "Other"]
                # #region agent log
                _debug_log("app/routes/leads.py:subject=Other", "Subject filter Other: matching custom subjects", {"predefined_count": len(predefined_non_other)}, "F")
                # #endregion
                base_query = base_query.where(
                    or_(Lead.subject.is_(None), Lead.subject.notin_(predefined_non_other))
                )
                # When subject_other is provided, narrow by partial match on Lead.subject (e.g. "psychology").
                if subject_other and str(subject_other).strip():
                    base_query = base_query.where(Lead.subject.ilike(f"%{subject_other.strip()}%"))
            else:
                base_query = base_query.where(Lead.subject == subject)

        # Total count
        count_result = await session.execute(base_query)
        all_leads = count_result.scalars().all()
        total = len(all_leads)

        # Pagination
        offset = (page - 1) * page_size
        paginated_items = all_leads[offset : offset + page_size]

        # #region agent log
        _debug_log(
            "app/routes/leads.py:118",
            "Leads retrieved successfully",
            {"count": len(paginated_items), "total": total},
            "C",
        )
        # #endregion

        return {
            "items": [LeadResponse.model_validate(lead) for lead in paginated_items],
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        }

    except Exception as e:
        # #region agent log
        _debug_log(
            "app/routes/leads.py:122",
            "Error retrieving leads",
            {"error_type": type(e).__name__, "error": str(e)},
            "C",
        )
        # #endregion
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leads",
        )


@router.get(
    "/v1/leads/new-count",
    summary="Count of new leads",
    description="Return the number of leads with status=new for UI badges. PROTECTED - requires authentication.",
)
async def get_new_leads_count(
    session: AsyncSession = Depends(get_session),
    current_user=Depends(require_role("admin", "user")),
):
    """Lightweight endpoint for the Leads Table nav badge. Uses COUNT and a short TTL cache for admins to cut DB load from polling. Cache invalidated on create_lead and status change."""
    try:
        is_admin = type(current_user).__name__ == "Admin"
        if is_admin:
            async def _fetch():
                stmt = select(func.count(Lead.id)).where(Lead.status == "new")
                r = await session.execute(stmt)
                return int(r.scalar() or 0)
            count = await get_cached("new_leads", _fetch(), ttl=5)
        else:
            stmt = (
                select(func.count(Lead.id))
                .where(Lead.status == "new")
                .where(or_(Lead.user_id.is_(None), Lead.user_id == current_user.id))
            )
            result = await session.execute(stmt)
            count = int(result.scalar() or 0)
        return {"count": count}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve new leads count",
        ) from e


@router.get(
    "/v1/leads/stats",
    summary="Get lead statistics",
    description="Comprehensive statistics with conversion rates, trends, source performance. PROTECTED - requires authentication."
)
async def get_lead_stats(
    session: AsyncSession = Depends(get_session),
    current_user = Depends(require_role("admin", "user")),
):
    """
    Return comprehensive statistics for leads with conversion metrics, trends, and performance data.
    Admins see all leads; approved users see stats for unassigned leads or leads assigned to them.
    """
    try:
        from datetime import datetime, timedelta
        
        is_admin = type(current_user).__name__ == "Admin"
        statement = select(Lead)
        if not is_admin:
            statement = statement.where(
                or_(Lead.user_id.is_(None), Lead.user_id == current_user.id)
            )
        result = await session.execute(statement)
        leads = result.scalars().all()

        total = len(leads)
        if total == 0:
            return {
                "total": 0,
                "by_status": {},
                "recent": [],
                "conversion_rates": {},
                "trends": {},
                "source_performance": {},
                "country_analytics": {},
                "time_metrics": {},
            }

        # Status breakdown
        by_status: dict[str, int] = {}
        for lead in leads:
            status_key = (lead.status or "unknown").lower()
            by_status[status_key] = by_status.get(status_key, 0) + 1

        # Conversion rates (logical business metrics)
        conversion_rates = {
            "qualified_rate": round((by_status.get("qualified", 0) / total * 100), 1) if total > 0 else 0,
            "won_rate": round((by_status.get("won", 0) / total * 100), 1) if total > 0 else 0,
            "lost_rate": round((by_status.get("lost", 0) / total * 100), 1) if total > 0 else 0,
            "contact_rate": round((by_status.get("contacted", 0) / total * 100), 1) if total > 0 else 0,
        }
        
        # Calculate win rate from qualified leads (more meaningful metric)
        qualified_count = by_status.get("qualified", 0)
        if qualified_count > 0:
            conversion_rates["qualified_to_win_rate"] = round(
                (by_status.get("won", 0) / qualified_count * 100), 1
            )
        else:
            conversion_rates["qualified_to_win_rate"] = 0

        # Time-based trends (last 7 days, 30 days)
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        leads_this_week = [l for l in leads if l.created_at >= week_ago]
        leads_this_month = [l for l in leads if l.created_at >= month_ago]
        
        # Previous periods for comparison
        two_weeks_ago = now - timedelta(days=14)
        two_months_ago = now - timedelta(days=60)
        
        prev_week_leads = [l for l in leads if two_weeks_ago <= l.created_at < week_ago]
        prev_month_leads = [l for l in leads if two_months_ago <= l.created_at < month_ago]
        
        # Calculate growth rates
        week_growth = 0
        if len(prev_week_leads) > 0:
            week_growth = round(((len(leads_this_week) - len(prev_week_leads)) / len(prev_week_leads) * 100), 1)
        elif len(leads_this_week) > 0:
            week_growth = 100  # New period
        
        month_growth = 0
        if len(prev_month_leads) > 0:
            month_growth = round(((len(leads_this_month) - len(prev_month_leads)) / len(prev_month_leads) * 100), 1)
        elif len(leads_this_month) > 0:
            month_growth = 100  # New period

        trends = {
            "leads_this_week": len(leads_this_week),
            "leads_this_month": len(leads_this_month),
            "week_growth": week_growth,
            "month_growth": month_growth,
            "avg_daily_leads_week": round(len(leads_this_week) / 7, 1) if len(leads_this_week) > 0 else 0,
            "avg_daily_leads_month": round(len(leads_this_month) / 30, 1) if len(leads_this_month) > 0 else 0,
        }

        # Source performance (which sources generate most leads and conversions)
        source_stats: dict[str, dict] = {}
        for lead in leads:
            source = (lead.source or "unknown").lower()
            if source not in source_stats:
                source_stats[source] = {"total": 0, "won": 0, "qualified": 0}
            source_stats[source]["total"] += 1
            status_lower = (lead.status or "").lower()
            if status_lower == "won":
                source_stats[source]["won"] += 1
            if status_lower == "qualified":
                source_stats[source]["qualified"] += 1
        
        # Calculate conversion rates per source
        source_performance = {}
        for source, data in source_stats.items():
            source_performance[source] = {
                "total": data["total"],
                "won": data["won"],
                "qualified": data["qualified"],
                "conversion_rate": round((data["won"] / data["total"] * 100), 1) if data["total"] > 0 else 0,
                "qualified_rate": round((data["qualified"] / data["total"] * 100), 1) if data["total"] > 0 else 0,
            }
        
        # Sort sources by total leads (most productive first)
        source_performance = dict(sorted(source_performance.items(), key=lambda x: x[1]["total"], reverse=True))

        # Country analytics (top source countries and target countries)
        source_countries: dict[str, int] = {}
        target_countries: dict[str, int] = {}
        for lead in leads:
            src_country = (lead.country or "unknown").lower()
            tgt_country = (lead.target_country or "unknown").lower()
            source_countries[src_country] = source_countries.get(src_country, 0) + 1
            target_countries[tgt_country] = target_countries.get(tgt_country, 0) + 1
        
        # Get top 5 for each
        top_source_countries = dict(sorted(source_countries.items(), key=lambda x: x[1], reverse=True)[:5])
        top_target_countries = dict(sorted(target_countries.items(), key=lambda x: x[1], reverse=True)[:5])

        country_analytics = {
            "top_source_countries": top_source_countries,
            "top_target_countries": top_target_countries,
        }

        # Time metrics (average age of leads by status)
        time_metrics = {}
        status_groups = {}
        for lead in leads:
            status_key = (lead.status or "unknown").lower()
            if status_key not in status_groups:
                status_groups[status_key] = []
            status_groups[status_key].append(lead)
        
        for status_key, status_leads in status_groups.items():
            if status_leads:
                ages = [(now - l.created_at).days for l in status_leads]
                time_metrics[status_key] = {
                    "avg_age_days": round(sum(ages) / len(ages), 1),
                    "oldest_days": max(ages),
                    "newest_days": min(ages),
                }

        # Sort by created_at descending for "recent" list
        recent = sorted(leads, key=lambda l: l.created_at, reverse=True)[:10]

        return {
            "total": total,
            "by_status": by_status,
            "recent": [LeadResponse.model_validate(l) for l in recent],
            "conversion_rates": conversion_rates,
            "trends": trends,
            "source_performance": source_performance,
            "country_analytics": country_analytics,
            "time_metrics": time_metrics,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve lead statistics: {str(e)}",
        )


@router.get(
    "/v1/leads/{lead_id}",
    response_model=LeadResponse,
    summary="Get single lead",
    description="Retrieve a specific lead by ID. PROTECTED - requires staff authentication."
)
async def get_lead(
    lead_id: int,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(require_role("admin", "user"))
) -> LeadResponse:
    """
    Get a single lead by ID (protected).
    
    Admins can access any lead; users can only access their own.
    """
    # #region agent log
    _debug_log("app/routes/leads.py:145", "GET /api/v1/leads/{lead_id} called", {"lead_id": lead_id, "user_id": current_user.id}, "C")
    # #endregion
    
    try:
        is_admin = type(current_user).__name__ == "Admin"
        statement = select(Lead).where(Lead.id == lead_id)
        
        if not is_admin:
            statement = statement.where(Lead.user_id == current_user.id)
        
        result = await session.execute(statement)
        lead = result.scalar_one_or_none()
        
        if not lead:
            # #region agent log
            _debug_log("app/routes/leads.py:152", "Lead not found", {"lead_id": lead_id}, "C")
            # #endregion
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lead with ID {lead_id} not found"
            )
        
        # #region agent log
        _debug_log("app/routes/leads.py:158", "Lead retrieved successfully", {"lead_id": lead.id}, "C")
        # #endregion
        
        return LeadResponse.model_validate(lead)
    
    except HTTPException:
        raise
    except Exception as e:
        # #region agent log
        _debug_log("app/routes/leads.py:164", "Error retrieving lead", {"lead_id": lead_id, "error_type": type(e).__name__, "error": str(e)}, "C")
        # #endregion
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve lead"
        )


@router.patch(
    "/v1/leads/{lead_id}/status",
    summary="Update lead status",
    description="Update the status of a lead with optimistic locking for concurrency safety. PROTECTED - requires staff authentication."
)
async def update_lead_status(
    lead_id: int,
    new_status: str = Query(..., min_length=2, max_length=50),
    version: int = Query(..., ge=0, description="Current version for optimistic locking"),
    session: AsyncSession = Depends(get_session),
    current_user = Depends(require_role("admin", "user")),
) -> LeadResponse:
    """
    Update the status of a single lead with optimistic locking.
    
    Requires version parameter to prevent concurrent update conflicts.
    """
    try:
        is_admin = type(current_user).__name__ == "Admin"
        statement = select(Lead).where(Lead.id == lead_id)
        
        if not is_admin:
            statement = statement.where(
                or_(Lead.user_id.is_(None), Lead.user_id == current_user.id)
            )
        
        result = await session.execute(statement)
        lead = result.scalar_one_or_none()

        if not lead:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Lead with ID {lead_id} not found",
            )
        
        # Optimistic locking: check version matches
        if lead.version != version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Lead was modified by another user. Please refresh and try again.",
            )

        lead.status = new_status.strip().lower()
        lead.version += 1
        
        # Use transaction for atomic update
        async with session.begin_nested():
            session.add(lead)
            await session.commit()
        
        await session.refresh(lead)
        invalidate("new_leads")

        return LeadResponse.model_validate(lead)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update lead status",
        )


