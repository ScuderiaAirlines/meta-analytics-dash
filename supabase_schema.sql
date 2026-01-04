-- Supabase Database Schema for Meta Ads Data
-- Run this in your Supabase SQL editor to create the tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    objective TEXT,
    daily_budget NUMERIC(12, 2),
    lifetime_budget NUMERIC(12, 2),
    effective_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- AdSets table
CREATE TABLE IF NOT EXISTS adsets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adset_id TEXT UNIQUE NOT NULL,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    targeting JSONB,
    budget NUMERIC(12, 2),
    optimization_goal TEXT,
    billing_event TEXT,
    bid_strategy TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_adsets_adset_id ON adsets(adset_id);
CREATE INDEX IF NOT EXISTS idx_adsets_campaign_id ON adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adsets_status ON adsets(status);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id TEXT UNIQUE NOT NULL,
    adset_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    creative_id TEXT,
    thumbnail_url TEXT,
    image_url TEXT,
    creative_body TEXT,
    creative_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (adset_id) REFERENCES adsets(adset_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ads_ad_id ON ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_ads_adset_id ON ads(adset_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);

-- Daily Metrics table
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('campaign', 'adset', 'ad')),
    date DATE NOT NULL,
    spend NUMERIC(12, 4) NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    cpc NUMERIC(10, 4) NOT NULL DEFAULT 0,
    ctr NUMERIC(6, 4) NOT NULL DEFAULT 0,
    roas NUMERIC(10, 4) NOT NULL DEFAULT 0,
    cpm NUMERIC(10, 4) NOT NULL DEFAULT 0,
    frequency NUMERIC(6, 4),
    reach INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_entity_date UNIQUE (entity_id, entity_type, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_entity ON daily_metrics(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_entity_date ON daily_metrics(entity_id, entity_type, date);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adsets_updated_at BEFORE UPDATE ON adsets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
