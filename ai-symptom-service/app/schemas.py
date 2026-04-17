from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class RecommendSpecialtiesRequest(BaseModel):
    symptoms: str = Field(..., min_length=1, max_length=2000)
    age: Optional[int] = Field(default=None, ge=0, le=120)
    durationDays: Optional[int] = Field(default=None, ge=0, le=365)
    baseline: List[str] = Field(default_factory=list, max_length=10)
    model: Optional[str] = None


class RecommendSpecialtiesResponse(BaseModel):
    specialties: List[str]
    source: str  # "ml" | "baseline"
    modelVersion: str
