# Database Schema

PostgreSQL schema for the Fake Account Detection system.

## Setup

```bash
# Create database
createdb fake_account_detection

# Apply schema (from project root)
psql -d fake_account_detection -f database/schema.sql
```

On Windows with default PostgreSQL install:
```cmd
psql -U postgres -d postgres -c "CREATE DATABASE fake_account_detection;"
psql -U postgres -d fake_account_detection -f database/schema.sql
```

Update `backend/.env` with your connection string:
`DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/fake_account_detection`

## Tables (Cyber Security & Detection)

| Table | Purpose |
|-------|---------|
| **users** | App users (login/register); password_hash, role, email_verified |
| **refresh_tokens** | Token rotation / session invalidation |
| **audit_logs** | Security: all critical actions (login, register, predict) with IP, user_agent |
| **login_attempts** | Security: brute-force tracking (success/fail per email and IP) |
| **social_account_profiles** | Input features for each analysis (age, followers, engagement, etc.) |
| **detection_results** | ML prediction outcome, risk score, model version |
| **ml_models** | Metadata for deployed model versions |

## Security Features

- Passwords stored as bcrypt hashes (backend).
- Audit trail for auth and detection actions.
- Login attempt logging for rate limiting and anomaly detection.
- Optional refresh token table for secure session handling.
