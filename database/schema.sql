-- Fake Social Media Account Detection - Database Schema
-- PostgreSQL - Run once to create all tables (idempotent)

-- Cleanup existing tables (if any)
DROP TABLE IF EXISTS ml_models CASCADE;
DROP TABLE IF EXISTS detection_results CASCADE;
DROP TABLE IF EXISTS social_account_profiles CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension (optional, for UUID primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (application users - login/register)
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'auditor')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================
-- 2. REFRESH TOKENS (for secure session / token rotation)
-- ============================================================
CREATE TABLE refresh_tokens (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    device_info     VARCHAR(500),
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ============================================================
-- 3. AUDIT LOG (cyber security - track all critical actions)
-- ============================================================
CREATE TABLE audit_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource        VARCHAR(100),
    resource_id     VARCHAR(100),
    ip_address      INET,
    user_agent      TEXT,
    request_method  VARCHAR(10),
    request_path    VARCHAR(500),
    status_code     INTEGER,
    details         JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);

-- ============================================================
-- 4. LOGIN ATTEMPTS (brute-force protection / security)
-- ============================================================
CREATE TABLE login_attempts (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    ip_address      INET,
    success         BOOLEAN NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);

-- ============================================================
-- 5. SOCIAL ACCOUNT PROFILES (input for ML detection)
-- ============================================================
CREATE TABLE social_account_profiles (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform            VARCHAR(50) NOT NULL DEFAULT 'generic',
    username            VARCHAR(255),
    -- Behavioral & profile features (aligned with ML model)
    account_age_days    INTEGER,
    followers_count     INTEGER,
    following_count     INTEGER,
    post_count          INTEGER,
    posts_per_week      NUMERIC(10,4),
    has_profile_picture BOOLEAN,
    has_bio             BOOLEAN,
    bio_length          INTEGER,
    username_length     INTEGER,
    following_follower_ratio NUMERIC(10,4),
    engagement_rate     NUMERIC(10,4),
    account_created_at  TIMESTAMPTZ,
    raw_features       JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_profiles_user_id ON social_account_profiles(user_id);
CREATE INDEX idx_social_profiles_platform ON social_account_profiles(platform);

-- ============================================================
-- 6. DETECTION RESULTS (ML predictions + history)
-- ============================================================
CREATE TABLE detection_results (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id          INTEGER REFERENCES social_account_profiles(id) ON DELETE SET NULL,
    is_fake_prediction  BOOLEAN NOT NULL,
    fake_probability    NUMERIC(5,4),
    risk_score          INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    model_version      VARCHAR(50),
    input_snapshot     JSONB,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_detection_results_user_id ON detection_results(user_id);
CREATE INDEX idx_detection_results_created_at ON detection_results(created_at);
CREATE INDEX idx_detection_results_is_fake ON detection_results(is_fake_prediction);

-- ============================================================
-- 7. ML MODEL METADATA (track deployed model version)
-- ============================================================
CREATE TABLE ml_models (
    id              SERIAL PRIMARY KEY,
    version         VARCHAR(50) NOT NULL UNIQUE,
    algorithm       VARCHAR(100) NOT NULL,
    metrics         JSONB,
    feature_names   TEXT[],
    file_path       VARCHAR(500),
    is_active       BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Triggers: updated_at for users
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
