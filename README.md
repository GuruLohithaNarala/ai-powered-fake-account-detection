# Fake Social Media Account Detection System

A full-stack **cyber security** project that uses machine learning to automatically detect fake accounts on social media platforms. The system analyzes user profile attributes, activity patterns, and behavioral characteristics to distinguish genuine users from fake ones.

## Features

- **Two Portals**: **User Portal** (register, login, detect, history) and **Admin Portal** (dashboard, users, detections, audit logs, login attempts)
- **User Authentication**: Secure login & registration with JWT, bcrypt, rate limiting
- **ML-Powered Detection**: Random Forest model trained on 10K+ synthetic social account profiles
- **Behavioral Analysis**: Posting frequency, account age, interaction ratios, profile consistency
- **Audit & Security**: Audit logs, session tracking, input validation, security headers
- **Dashboard**: Real-time analysis, risk scores, and detection history

## Tech Stack

| Layer    | Technology   |
|----------|--------------|
| Frontend | React 18     |
| Backend  | Node.js + Express |
| Database | PostgreSQL   |
| ML       | Python (scikit-learn Random Forest) |

## Project Structure

```
Batch-3/
├── backend/          # Node.js API
├── frontend/         # React app
├── ml-model/         # Python training + dataset
├── database/         # Schema & migrations
└── README.md
```

## Quick Start

### 1. Database

```bash
# Create PostgreSQL database
createdb fake_account_detection

# Run schema
psql -d fake_account_detection -f database/schema.sql

# (Optional) Create admin user for Admin Portal — email: admin@example.com, password: Admin@123
psql -d fake_account_detection -f database/seed-admin.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Edit with your DB URL and JWT secret
npm install
npm run dev
```

### 3. ML Model (one-time)

```bash
cd ml-model
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python generate_dataset.py
python train_model.py
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

- **User Portal**: http://localhost:5173 — Register, login, use detection and history.
- **Admin Portal**: http://localhost:5173/admin/login — Sign in with an admin account (see `database/seed-admin.sql`).

## Environment Variables

- **Backend** (`backend/.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `NODE_ENV`, `PORT`, `CORS_ORIGIN`
- **Frontend**: `VITE_API_URL` (optional, defaults to backend URL)

## License

MIT
