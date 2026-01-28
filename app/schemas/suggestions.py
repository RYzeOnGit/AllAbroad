from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


DegreeLevel = Literal["bachelor", "master", "phd"]


class SuggestionRequest(BaseModel):
    target_country: str = Field(..., min_length=2, max_length=64)
    degree_level: Optional[DegreeLevel] = None
    subject: Optional[str] = Field(None, min_length=2, max_length=64)
    budget_usd_per_year: Optional[int] = Field(None, ge=0, le=250000)
    language: Optional[str] = Field(None, min_length=2, max_length=32)
    max_results: int = Field(8, ge=1, le=20)
    include_alternatives: bool = True


class SuggestionItem(BaseModel):
    id: str
    name: str
    country: str
    city: str
    score: float
    why: list[str]
    highlights: list[str] = []
    fees_per_year_usd_est: Optional[int] = None
    ranking_band: Optional[str] = None


class SuggestionResponse(BaseModel):
    query: SuggestionRequest
    suggestions: list[SuggestionItem]
    alternatives: list[SuggestionItem] = []

