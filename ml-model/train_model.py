"""
Train Random Forest classifier for fake account detection.
Uses dataset.csv and saves model to model.pkl + feature order to features.txt.
"""
import pickle
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

BASE = Path(__file__).resolve().parent
DATASET = BASE / "dataset.csv"
MODEL_PATH = BASE / "model.pkl"
FEATURES_PATH = BASE / "features.txt"

FEATURE_COLS = [
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
TARGET = "is_fake"

def main():
    df = pd.read_csv(DATASET)
    X = df[FEATURE_COLS]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))
    print("Confusion matrix:\n", confusion_matrix(y_test, y_pred))
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": clf, "version": "v1", "features": FEATURE_COLS}, f)
    with open(FEATURES_PATH, "w") as f:
        f.write("\n".join(FEATURE_COLS))
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
