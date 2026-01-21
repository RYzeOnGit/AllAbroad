"""Lead submission endpoint."""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse
from app.utils.validation import validate_lead_data

router = APIRouter()

# #region agent log
import os
LOG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".cursor", "debug.log")
def _debug_log(location, message, data, hypothesis_id):
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps({"sessionId":"debug-session","runId":"run1","hypothesisId":hypothesis_id,"location":location,"message":message,"data":data,"timestamp":int(datetime.now().timestamp()*1000)}) + "\n")
    except: pass
# #endregion


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new lead",
    description="Capture and store a new study-abroad lead with validation and duplicate prevention."
)
async def create_lead(
    lead_data: LeadCreate,
    request: Request,
    session: AsyncSession = Depends(get_session)
) -> LeadResponse:
    """
    Create a new lead.
    
    Validates input, normalizes phone number, checks for duplicates,
    and stores the lead in the database.
    """
    # #region agent log
    _debug_log("app/routes/leads.py:20", "POST /api/leads endpoint called", {"path": str(request.url), "method": request.method, "client": str(request.client)}, "C")
    _debug_log("app/routes/leads.py:20", "Lead data received", {"name": lead_data.name, "phone": lead_data.phone, "country": lead_data.country}, "C")
    # #endregion
    try:
        # Validate and normalize phone number
        normalized_name, normalized_phone = validate_lead_data(
            lead_data.name,
            lead_data.phone
        )
        
        # Check for duplicate phone number
        statement = select(Lead).where(Lead.phone == normalized_phone)
        result = await session.execute(statement)
        existing_lead = result.scalar_one_or_none()
        
        if existing_lead:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Lead with phone number {normalized_phone} already exists"
            )
        
        # Create new lead
        new_lead = Lead(
            name=normalized_name,
            phone=normalized_phone,
            country=lead_data.country.strip(),
            target_country=lead_data.target_country.strip(),
            intake=lead_data.intake.strip(),
            budget=lead_data.budget.strip() if lead_data.budget else None,
            source=lead_data.source.strip().lower(),
            status="new"
        )
        
        session.add(new_lead)
        await session.commit()
        await session.refresh(new_lead)
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

