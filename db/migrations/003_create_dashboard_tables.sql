-- Migration: create dashboard persistence tables
-- Run this in your Supabase SQL editor or via psql against the project's DB.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.dashboard_configs (
  owner_email text PRIMARY KEY,
  config jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dashboard_regions (
  owner_email text PRIMARY KEY,
  regions jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dashboard_gtm_settings (
  owner_email text PRIMARY KEY,
  settings jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deployment_requests (
  owner_email text NOT NULL,
  id text PRIMARY KEY,
  version text NOT NULL,
  environment text NOT NULL,
  status text NOT NULL,
  requested_by text NOT NULL,
  regions jsonb NOT NULL,
  log jsonb NOT NULL,
  health_checks jsonb NOT NULL,
  external_url text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deployment_requests_owner_email
  ON public.deployment_requests (owner_email);

CREATE INDEX IF NOT EXISTS idx_deployment_requests_created_at
  ON public.deployment_requests (created_at DESC);
