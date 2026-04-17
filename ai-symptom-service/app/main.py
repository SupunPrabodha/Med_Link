from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import FastAPI, Header, HTTPException

from .predictor import SpecialtyPredictor
from .schemas import RecommendSpecialtiesRequest, RecommendSpecialtiesResponse


API_KEY = os.getenv("AI_API_KEY", "")

app = FastAPI(title="AI Symptom Service", version=os.getenv("AI_MODEL_VERSION", "dev"))

predictor = SpecialtyPredictor()


@app.on_event("startup")
def _startup() -> None:
    predictor.load_if_available()


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat(),
        "model": {
            "version": predictor.model_info.version,
            "kind": predictor.model_info.kind,
        },
    }


@app.get("/metadata")
def metadata() -> dict:
    return {
        "service": "ai-symptom-service",
        "modelVersion": predictor.model_info.version,
        "modelKind": predictor.model_info.kind,
        "outputKind": os.getenv("AI_OUTPUT_KIND", "specialty"),
        "dataset": os.getenv("AI_DATASET_NAME", ""),
    }


@app.post("/recommend-specialties", response_model=RecommendSpecialtiesResponse)
def recommend_specialties(
    req: RecommendSpecialtiesRequest,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> RecommendSpecialtiesResponse:
    if API_KEY:
        if not x_api_key or x_api_key != API_KEY:
            raise HTTPException(status_code=401, detail="Invalid API key")

    # Model can be absent; service still returns baseline deterministically.
    recs, source = predictor.recommend(req.symptoms, req.baseline, req.model)
    if not recs:
        raise HTTPException(status_code=500, detail="No specialties computed")

    return RecommendSpecialtiesResponse(
        specialties=recs,
        source=source,
        modelVersion=predictor.model_info.version,
    )
