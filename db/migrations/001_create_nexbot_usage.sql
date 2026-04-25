-- Migration: create nexbot_usage table for Nexbot usage tracking
-- Run this in your Supabase SQL editor or via psql against the project's DB.

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.nexbot_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  bot_id text,
  region text,
  model text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nexbot_usage_identifier_created_at
  ON public.nexbot_usage (identifier, created_at);

-- Optional: a compact view for counting recent usage per identifier
CREATE OR REPLACE VIEW public.v_nexbot_usage_recent AS
SELECT identifier, count(*) AS cnt, max(created_at) AS last_at
FROM public.nexbot_usage
GROUP BY identifier;
