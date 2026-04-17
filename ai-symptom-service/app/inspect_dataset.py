from __future__ import annotations

import os

import pandas as pd


def main() -> None:
    dataset_path = os.getenv("AI_DATASET_PATH", "")
    if not dataset_path:
        raise SystemExit("AI_DATASET_PATH is required")

    df = pd.read_csv(dataset_path)
    print("Columns:")
    for c in df.columns:
        print(f"- {c}")

    print("\nRow count:", len(df))
    if len(df) > 0:
        first = df.iloc[0].to_dict()
        print("\nFirst row (keys only):")
        for k in first.keys():
            print(f"- {k}")


if __name__ == "__main__":
    main()
