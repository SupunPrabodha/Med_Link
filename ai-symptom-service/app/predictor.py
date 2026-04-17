from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import List, Optional

import joblib


def _clean_specialties(items: List[str], limit: int = 5) -> List[str]:
    out: list[str] = []
    seen: set[str] = set()
    for s in items or []:
        if s is None:
            continue
        t = str(s).strip().replace(",", " ")
        t = " ".join(t.split())
        if not t:
            continue
        if len(t) > 80:
            t = t[:80]
        key = t.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(t)
        if len(out) >= limit:
            break
    return out


@dataclass(frozen=True)
class ModelInfo:
    version: str
    kind: str


class SpecialtyPredictor:
    def __init__(self) -> None:
        self._model = None
        self._model_info = ModelInfo(version="none", kind="none")
        self._output_kind = (os.getenv("AI_OUTPUT_KIND", "specialty") or "specialty").strip().lower()
        self._disease_to_specialty = self._load_disease_mapping()

    @property
    def model_info(self) -> ModelInfo:
        return self._model_info

    def load_if_available(self) -> None:
        model_path = os.getenv("AI_MODEL_PATH", "/models/model.joblib")
        version = os.getenv("AI_MODEL_VERSION", "dev")

        if not os.path.exists(model_path):
            self._model = None
            self._model_info = ModelInfo(version="none", kind="none")
            return

        self._model = joblib.load(model_path)
        self._model_info = ModelInfo(version=version, kind=type(self._model).__name__)

    def _load_disease_mapping(self) -> dict[str, list[str]]:
        path = os.getenv("AI_DISEASE_TO_SPECIALTY_PATH", "")
        if not path:
            return {}
        if not os.path.exists(path):
            return {}

        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = json.load(f)
        except Exception:
            return {}

        out: dict[str, list[str]] = {}
        if isinstance(raw, dict):
            for k, v in raw.items():
                if not isinstance(k, str) or not k.strip():
                    continue
                key = k.strip().lower()

                if isinstance(v, str):
                    out[key] = _clean_specialties([v])
                elif isinstance(v, list):
                    out[key] = _clean_specialties([str(x) for x in v])

        return out

    def _map_diseases_to_specialties(self, diseases: list[str]) -> list[str]:
        if not diseases:
            return []
        if not self._disease_to_specialty:
            return []

        mapped: list[str] = []
        for d in diseases:
            if d is None:
                continue
            key = str(d).strip().lower()
            if not key:
                continue
            mapped.extend(self._disease_to_specialty.get(key, []))

        return _clean_specialties(mapped)

    def recommend(self, symptoms: str, baseline: List[str], model_hint: Optional[str] = None) -> tuple[List[str], str]:
        baseline_clean = _clean_specialties(baseline)
        if self._model is None:
            return (baseline_clean or ["General Medicine"], "baseline")

        try:
            # Expecting a scikit-learn Pipeline that outputs class labels.
            pred = self._model.predict([symptoms])
            if hasattr(pred, "tolist"):
                pred = pred.tolist()
            if isinstance(pred, list) and pred:
                raw = pred[0]
                # Allow model to return either a string label or a list of labels.
                if isinstance(raw, list):
                    labels = [str(x) for x in raw]
                else:
                    labels = [str(raw)]
            else:
                labels = []

            if self._output_kind == "disease":
                diseases = _clean_specialties(labels)
                recs = self._map_diseases_to_specialties(diseases)
            else:
                recs = _clean_specialties(labels)
        except Exception:
            recs = []

        if not recs:
            return (baseline_clean or ["General Medicine"], "baseline")
        return (recs, "ml")
