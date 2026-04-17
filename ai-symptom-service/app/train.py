from __future__ import annotations

import os
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


def main() -> None:
    dataset_path = os.getenv("AI_DATASET_PATH", "")
    text_col = os.getenv("AI_TEXT_COL", "symptoms")
    label_col = os.getenv("AI_LABEL_COL", "specialty")
    model_out = os.getenv("AI_MODEL_OUT", "/models/model.joblib")

    if not dataset_path:
        raise SystemExit("AI_DATASET_PATH is required")

    df = pd.read_csv(dataset_path)

    if text_col not in df.columns or label_col not in df.columns:
        raise SystemExit(
            f"Dataset columns not found. Have={list(df.columns)} need text={text_col} label={label_col}"
        )

    df = df[[text_col, label_col]].dropna()
    df[text_col] = df[text_col].astype(str).str.strip()
    df[label_col] = df[label_col].astype(str).str.strip()
    df = df[(df[text_col] != "") & (df[label_col] != "")]

    if len(df) < 50:
        raise SystemExit(f"Not enough rows after cleaning: {len(df)}")

    X = df[text_col].tolist()
    y = df[label_col].tolist()

    pipeline = Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, max_features=50_000)),
            ("clf", LogisticRegression(max_iter=2000, n_jobs=1)),
        ]
    )

    pipeline.fit(X, y)

    out_path = Path(model_out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, out_path)

    print(f"Saved model to {out_path}")


if __name__ == "__main__":
    main()
