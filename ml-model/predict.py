"""
Run prediction from command line: python predict.py '<json_features>'
Outputs JSON: {"prediction": 0|1, "probability": float, "model_version": "v1"}
"""
import sys
import json
import pickle
from pathlib import Path

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "model.pkl"

FEATURE_ORDER = [
    "account_age_days",
    "followers_count",
    "following_count",
    "post_count",
    "posts_per_week",
    "has_profile_picture",
    "has_bio",
    "bio_length",
    "username_length",
    "following_follower_ratio",
    "engagement_rate",
]

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python predict.py '<json_features>'"}))
        sys.exit(1)
    try:
        features = json.loads(sys.argv[1])
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    vec = [float(features.get(k, 0)) for k in FEATURE_ORDER]
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    model = data["model"]
    version = data.get("version", "v1")
    proba = model.predict_proba([vec])[0]
    pred = 1 if proba[1] >= 0.5 else 0
    out = {
        "prediction": pred,
        "probability": float(proba[1]),
        "model_version": version,
    }
    print(json.dumps(out))

if __name__ == "__main__":
    main()
