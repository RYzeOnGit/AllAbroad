"""Lead submission endpoint."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.database import get_session
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse
from app.utils.validation import validate_lead_data

router = APIRouter()


@router.post(
    "",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new lead",
    description="Capture and store a new study-abroad lead with validation and duplicate prevention."
)
async def create_lead(
    lead_data: LeadCreate,
    session: AsyncSession = Depends(get_session)
) -> LeadResponse:
    """
    Create a new lead.
    
    Validates input, normalizes phone number, checks for duplicates,
    and stores the lead in the database.
    """
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
        
        return LeadResponse.model_validate(new_lead)
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Log error in production
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

