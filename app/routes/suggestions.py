from __future__ import annotations

from fastapi import APIRouter

from app.schemas.suggestions import SuggestionRequest, SuggestionResponse, SuggestionItem
from app.utils.suggestions import load_universities, suggest

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.post("", response_model=SuggestionResponse)
async def get_suggestions(payload: SuggestionRequest) -> SuggestionResponse:
    """
    Public endpoint: return university suggestions for visitors.

    MVP:
    - deterministic scoring over a curated dataset
    - explainability included in response
    """
    universities = load_universities()

    suggestions, alternatives = suggest(
        universities,
        target_country=payload.target_country,
        degree_level=payload.degree_level,
        subject=payload.subject,
        budget_usd_per_year=payload.budget_usd_per_year,
        language=payload.language,
        max_results=payload.max_results,
        include_alternatives=payload.include_alternatives,
    )

    return SuggestionResponse(
        query=payload,
        suggestions=[SuggestionItem(**x) for x in suggestions],
        alternatives=[SuggestionItem(**x) for x in alternatives],
    )


