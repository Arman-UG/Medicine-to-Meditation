-- ============================================================
-- PROJECT: CALM — PostgreSQL Schema (Version 1)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    stress_level VARCHAR(20) DEFAULT NULL CHECK (stress_level IN ('mild', 'moderate', 'high', NULL)),
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '72 hours'),
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. USER RENEWAL PREFERENCES
CREATE TABLE IF NOT EXISTS renewal_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_mode VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (preferred_mode IN ('manual', 'autopay')),
    autopay_consent BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'breathing',
    default_duration_sec INTEGER NOT NULL DEFAULT 300,
    rhythm_pattern JSONB DEFAULT NULL,
    step_instructions JSONB NOT NULL,
    what_to_expect JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. AUDIO TRACKS TABLE
CREATE TABLE IF NOT EXISTS audio_tracks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    artist VARCHAR(150) NOT NULL DEFAULT 'Calm Soundscapes',
    category VARCHAR(50) NOT NULL DEFAULT 'ambient',
    frequency_hz INTEGER DEFAULT NULL,
    duration_sec INTEGER NOT NULL DEFAULT 600,
    audio_type VARCHAR(20) NOT NULL DEFAULT 'generative', -- generative synth or audio file
    file_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PAYMENT ORDERS TABLE
CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
    amount_paise INTEGER NOT NULL DEFAULT 9900, -- Rs. 99
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'expired')),
    renewal_mode VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (renewal_mode IN ('manual', 'autopay')),
    qr_id VARCHAR(100) DEFAULT NULL,
    qr_payload TEXT DEFAULT NULL,
    qr_image_url TEXT DEFAULT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_rzp_id ON payment_orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- 6. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(100) UNIQUE NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL,
    amount_paise INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'upi',
    status VARCHAR(30) NOT NULL CHECK (status IN ('success', 'failed', 'refunded')),
    error_reason TEXT DEFAULT NULL,
    webhook_signature VARCHAR(255) DEFAULT NULL,
    webhook_payload JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_trans_rzp_payment_id ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_trans_status ON payment_transactions(status);

-- 7. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Calm Monthly Unlimited',
    amount_paise INTEGER NOT NULL DEFAULT 9900,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
    renewal_type VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (renewal_type IN ('manual', 'autopay')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    next_billing_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_payment_order_id UUID REFERENCES payment_orders(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 8. PAYMENT MANDATES TABLE (UPI AutoPay)
CREATE TABLE IF NOT EXISTS payment_mandates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    mandate_token VARCHAR(255) UNIQUE NOT NULL,
    upi_vpa VARCHAR(255) DEFAULT NULL,
    bank_reference VARCHAR(255) DEFAULT NULL,
    max_amount_paise INTEGER NOT NULL DEFAULT 9900,
    frequency VARCHAR(30) NOT NULL DEFAULT 'monthly',
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'revoked', 'failed')),
    authorized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. USER ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id VARCHAR(64) NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    duration_completed_sec INTEGER NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    stress_level_before VARCHAR(20) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON user_activity_logs(created_at);
