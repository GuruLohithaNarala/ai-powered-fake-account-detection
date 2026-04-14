"""
Generate synthetic dataset for fake social media account detection.
~10,000 records with features: account age, followers, following, posts,
posting frequency, profile completeness, engagement, etc.
"""
import random
import csv
from pathlib import Path

OUTPUT = Path(__file__).resolve().parent / "dataset.csv"
N_SAMPLES = 10000
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

def gen_fake():
    # Fake accounts: new, few followers, high following, low posts, erratic ratio
    return {
        "account_age_days": random.randint(1, 180),
        "followers_count": random.randint(0, 500),
        "following_count": random.randint(100, 5000),
        "post_count": random.randint(0, 50),
        "posts_per_week": random.uniform(0, 2),
        "has_profile_picture": random.choice([0, 1]),
        "has_bio": random.choice([0, 0, 1]),
        "bio_length": random.randint(0, 50),
        "username_length": random.randint(5, 30),
        "following_follower_ratio": random.uniform(2, 50) if random.random() > 0.3 else random.uniform(0.5, 2),
        "engagement_rate": random.uniform(0, 0.05),
        "is_fake": 1,
    }

def gen_genuine():
    # Genuine: older accounts, more balanced, profile filled, higher engagement
    return {
        "account_age_days": random.randint(90, 2000),
        "followers_count": random.randint(50, 10000),
        "following_count": random.randint(10, 2000),
        "post_count": random.randint(20, 2000),
        "posts_per_week": random.uniform(0.5, 15),
        "has_profile_picture": 1,
        "has_bio": random.choice([0, 1, 1, 1]),
        "bio_length": random.randint(0, 200),
        "username_length": random.randint(4, 20),
        "following_follower_ratio": random.uniform(0.1, 2),
        "engagement_rate": random.uniform(0.01, 0.25),
        "is_fake": 0,
    }

def main():
    rows = []
    for _ in range(N_SAMPLES // 2):
        rows.append(gen_fake())
        rows.append(gen_genuine())
    if len(rows) < N_SAMPLES:
        for _ in range(N_SAMPLES - len(rows)):
            rows.append(gen_fake() if random.random() > 0.5 else gen_genuine())
    random.shuffle(rows)
    fieldnames = list(rows[0].keys())
    with open(OUTPUT, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"Generated {len(rows)} rows -> {OUTPUT}")

if __name__ == "__main__":
    main()
