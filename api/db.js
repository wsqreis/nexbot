import { Pool } from 'pg';
import { supabase } from './supabase.js';
import { readUsers, saveUsers } from './authUtils.js';

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_SSL = process.env.DATABASE_SSL;

const DASHBOARD_DIR = '.dashboard';
const CONFIG_FILE = `${DASHBOARD_DIR}/config.json`;
const REGIONS_FILE = `${DASHBOARD_DIR}/regions.json`;
const GTM_FILE = `${DASHBOARD_DIR}/gtm.json`;
const DEPLOYMENTS_FILE = `${DASHBOARD_DIR}/deployments.json`;

export const DEFAULT_CHATBOT_CONFIG = {
  botId: 'my-bot',
  botName: 'NexBot Assistant',
  greeting: 'Hi! How can I help you today?',
  theme: '#6366f1',
  position: 'bottom-right',
  model: 'gpt-4.1-mini',
  systemPrompt: 'You are a helpful customer support assistant for a Nordic energy company. Be concise, friendly, and practical.',
  maxTokens: 300,
  apiUrl: '/api/chat',
};

export const DEFAULT_REGIONS = [
  { code: 'fi', flag: '🇫🇮', name: 'Finland', lang: 'Finnish', status: 'active', greeting: 'Hei! Kuinka voin auttaa sinua tänään?' },
  { code: 'sv', flag: '🇸🇪', name: 'Sweden', lang: 'Swedish', status: 'active', greeting: 'Hej! Hur kan jag hjälpa dig idag?' },
  { code: 'no', flag: '🇳🇴', name: 'Norway', lang: 'Norwegian', status: 'active', greeting: 'Hei! Hvordan kan jeg hjelpe deg i dag?' },
  { code: 'dk', flag: '🇩🇰', name: 'Denmark', lang: 'Danish', status: 'pending', greeting: 'Hej! Hvordan kan jeg hjælpe dig i dag?' },
  { code: 'en', flag: '🌐', name: 'International', lang: 'English', status: 'active', greeting: 'Hi! How can I help you today?' },
];

export const DEFAULT_GTM_SETTINGS = {
  gtmId: 'GTM-XXXXXXX',
  tags: [
    { id: 1, name: 'NexBot - Widget Loaded', trigger: 'nexbot_widget_loaded', type: 'Custom Event', status: 'active' },
    { id: 2, name: 'NexBot - Chat Opened', trigger: 'nexbot_opened', type: 'Custom Event', status: 'active' },
    { id: 3, name: 'NexBot - Message Sent', trigger: 'nexbot_message_sent', type: 'Custom Event', status: 'active' },
    { id: 4, name: 'NexBot - Conversion', trigger: 'nexbot_message_received', type: 'Conversion', status: 'paused' },
  ],
};

export const DEFAULT_DEPLOYMENTS = [
  { id: 'v1.3.2-production-2025-05-14T14:22:00', version: 'v1.3.2', environment: 'production', createdAt: '2025-05-14T14:22:00Z', status: 'success', requestedBy: 'Wesley Reis', regions: ['fi', 'sv', 'no'], log: ['Health check passed'], healthChecks: [] },
  { id: 'v1.3.1-staging-2025-05-14T13:45:00', version: 'v1.3.1', environment: 'staging', createdAt: '2025-05-14T13:45:00Z', status: 'success', requestedBy: 'Wesley Reis', regions: ['fi', 'sv', 'no'], log: ['Staging request completed'], healthChecks: [] },
  { id: 'v1.3.0-production-2025-05-12T10:11:00', version: 'v1.3.0', environment: 'production', createdAt: '2025-05-12T10:11:00Z', status: 'success', requestedBy: 'Wesley Reis', regions: ['fi', 'sv'], log: ['Production request completed'], healthChecks: [] },
  { id: 'v1.2.9-staging-2025-05-11T16:30:00', version: 'v1.2.9', environment: 'staging', createdAt: '2025-05-11T16:30:00Z', status: 'failed', requestedBy: 'Wesley Reis', regions: ['fi'], log: ['Smoke tests failed'], healthChecks: [] },
];

let pool;

function shouldUseSsl(connectionString) {
  if (DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (DATABASE_SSL === 'false') return false;

  try {
    const { hostname } = new URL(connectionString);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'postgres' || hostname === 'db') {
      return false;
    }
  } catch {
    return false;
  }

  return { rejectUnauthorized: false };
}

function getPool() {
  if (!DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: shouldUseSsl(DATABASE_URL),
    });
  }
  return pool;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getFilePath(name) {
  return `${process.cwd()}/${name}`;
}

async function readJsonFile(name, fallback) {
  try {
    const fs = await import('fs/promises');
    const raw = await fs.readFile(getFilePath(name), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') return clone(fallback);
    throw error;
  }
}

async function writeJsonFile(name, value) {
  const fs = await import('fs/promises');
  await fs.mkdir(getFilePath(DASHBOARD_DIR), { recursive: true });
  await fs.writeFile(getFilePath(name), JSON.stringify(value, null, 2), 'utf8');
}

function normalizeConfig(config) {
  return { ...DEFAULT_CHATBOT_CONFIG, ...(config || {}) };
}

function normalizeRegions(regions) {
  const incoming = new Map((regions || []).map(region => [region.code, region]));
  return DEFAULT_REGIONS.map(region => ({ ...region, ...(incoming.get(region.code) || {}) }));
}

function normalizeGtm(settings) {
  const merged = { ...DEFAULT_GTM_SETTINGS, ...(settings || {}) };
  merged.tags = Array.isArray(merged.tags) ? merged.tags : clone(DEFAULT_GTM_SETTINGS.tags);
  return merged;
}

function normalizeDeployments(deployments) {
  return Array.isArray(deployments) ? deployments : clone(DEFAULT_DEPLOYMENTS);
}

async function ensureDashboardTables() {
  const pgPool = getPool();
  if (!pgPool) return;

  await pgPool.query(`
    create table if not exists public.dashboard_configs (
      owner_email text primary key,
      config jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  await pgPool.query(`
    create table if not exists public.dashboard_regions (
      owner_email text primary key,
      regions jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  await pgPool.query(`
    create table if not exists public.dashboard_gtm_settings (
      owner_email text primary key,
      settings jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  await pgPool.query(`
    create table if not exists public.deployment_requests (
      owner_email text not null,
      id text primary key,
      version text not null,
      environment text not null,
      status text not null,
      requested_by text not null,
      regions jsonb not null,
      log jsonb not null,
      health_checks jsonb not null,
      external_url text,
      created_at timestamptz not null,
      updated_at timestamptz not null default now()
    )
  `);
}

export function getStorageMode() {
  if (supabase) return 'supabase';
  if (DATABASE_URL) return 'postgres';
  return 'file';
}

export function isDatabaseConfigured() {
  return Boolean(supabase || DATABASE_URL);
}

export async function findUserByEmail(email) {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('name, email, password, role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed fetching user');
    }

    return data || null;
  }

  const pgPool = getPool();
  if (pgPool) {
    const result = await pgPool.query(
      'select name, email, password, role from public.users where email = $1 limit 1',
      [email],
    );
    return result.rows[0] || null;
  }

  const users = await readUsers();
  return users.find(user => user.email === email) || null;
}

export async function createUser({ name, email, password, role = 'admin' }) {
  if (supabase) {
    const { data: existing, error: existingErr } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingErr) {
      throw new Error(existingErr.message || 'Failed checking existing user');
    }

    if (existing) {
      const err = new Error('Email already registered');
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('users')
      .insert([{ name, email, password, role }])
      .select('name, email, role')
      .single();

    if (insertErr) {
      throw new Error(insertErr.message || 'Failed creating user');
    }

    return { name: inserted.name, email: inserted.email, role: inserted.role || role };
  }

  const pgPool = getPool();
  if (pgPool) {
    try {
      const inserted = await pgPool.query(
        'insert into public.users (name, email, password, role) values ($1, $2, $3, $4) returning name, email, role',
        [name, email, password, role],
      );
      return inserted.rows[0] || { name, email, role };
    } catch (error) {
      if (error && error.code === '23505') {
        const err = new Error('Email already registered');
        err.code = 'DUPLICATE_EMAIL';
        throw err;
      }
      throw error;
    }
  }

  const users = await readUsers();
  if (users.find(user => user.email === email)) {
    const err = new Error('Email already registered');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const user = { name, email, password, role };
  await saveUsers([...users, user]);
  return { name, email, role };
}

export async function countRecentUsage(identifier, sinceIso) {
  if (supabase) {
    const { count, error } = await supabase
      .from('nexbot_usage')
      .select('*', { count: 'exact' })
      .eq('identifier', identifier)
      .gte('created_at', sinceIso);

    if (error) return null;
    return typeof count === 'number' ? count : null;
  }

  const pgPool = getPool();
  if (!pgPool) return null;

  try {
    const result = await pgPool.query(
      'select count(*)::int as count from public.nexbot_usage where identifier = $1 and created_at >= $2',
      [identifier, sinceIso],
    );
    return result.rows[0]?.count ?? 0;
  } catch {
    return null;
  }
}

export async function recordUsage(entry) {
  if (supabase) {
    try {
      await supabase.from('nexbot_usage').insert([entry]);
    } catch {
      return;
    }
    return;
  }

  const pgPool = getPool();
  if (!pgPool) return;

  try {
    await pgPool.query(
      'insert into public.nexbot_usage (identifier, bot_id, region, model, meta, created_at) values ($1, $2, $3, $4, $5, $6)',
      [
        entry.identifier,
        entry.bot_id ?? null,
        entry.region ?? null,
        entry.model ?? null,
        entry.meta ? JSON.stringify(entry.meta) : null,
        entry.created_at ?? new Date().toISOString(),
      ],
    );
  } catch {
    return;
  }
}

export async function getDashboardConfig(ownerEmail) {
  if (supabase) {
    const { data, error } = await supabase
      .from('dashboard_configs')
      .select('config')
      .eq('owner_email', ownerEmail)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(error.message || 'Failed loading dashboard config');
    return normalizeConfig(data?.config);
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    const result = await pgPool.query('select config from public.dashboard_configs where owner_email = $1 limit 1', [ownerEmail]);
    return normalizeConfig(result.rows[0]?.config);
  }

  const allConfigs = await readJsonFile(CONFIG_FILE, {});
  return normalizeConfig(allConfigs[ownerEmail]);
}

export async function saveDashboardConfig(ownerEmail, config) {
  const normalized = normalizeConfig(config);

  if (supabase) {
    const { error } = await supabase.from('dashboard_configs').upsert({ owner_email: ownerEmail, config: normalized, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message || 'Failed saving dashboard config');
    return normalized;
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    await pgPool.query(
      `insert into public.dashboard_configs (owner_email, config, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (owner_email) do update set config = excluded.config, updated_at = now()`,
      [ownerEmail, JSON.stringify(normalized)],
    );
    return normalized;
  }

  const allConfigs = await readJsonFile(CONFIG_FILE, {});
  allConfigs[ownerEmail] = normalized;
  await writeJsonFile(CONFIG_FILE, allConfigs);
  return normalized;
}

export async function getRegions(ownerEmail) {
  if (supabase) {
    const { data, error } = await supabase
      .from('dashboard_regions')
      .select('regions')
      .eq('owner_email', ownerEmail)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(error.message || 'Failed loading regions');
    return normalizeRegions(data?.regions);
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    const result = await pgPool.query('select regions from public.dashboard_regions where owner_email = $1 limit 1', [ownerEmail]);
    return normalizeRegions(result.rows[0]?.regions);
  }

  const allRegions = await readJsonFile(REGIONS_FILE, {});
  return normalizeRegions(allRegions[ownerEmail]);
}

export async function saveRegion(ownerEmail, code, patch) {
  const regions = await getRegions(ownerEmail);
  const next = regions.map(region => region.code === code ? { ...region, ...patch, code: region.code } : region);

  if (supabase) {
    const { error } = await supabase.from('dashboard_regions').upsert({ owner_email: ownerEmail, regions: next, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message || 'Failed saving region');
    return normalizeRegions(next);
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    await pgPool.query(
      `insert into public.dashboard_regions (owner_email, regions, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (owner_email) do update set regions = excluded.regions, updated_at = now()`,
      [ownerEmail, JSON.stringify(next)],
    );
    return normalizeRegions(next);
  }

  const allRegions = await readJsonFile(REGIONS_FILE, {});
  allRegions[ownerEmail] = next;
  await writeJsonFile(REGIONS_FILE, allRegions);
  return normalizeRegions(next);
}

export async function getRegionStats(ownerEmail) {
  const regions = await getRegions(ownerEmail);
  const statsByRegion = Object.fromEntries(regions.map(region => [region.code, { users: null, sessions: null }]));

  if (!isDatabaseConfigured()) {
    return statsByRegion;
  }

  if (supabase) {
    for (const region of regions) {
      const { count, error } = await supabase
        .from('nexbot_usage')
        .select('*', { count: 'exact' })
        .eq('region', region.code);
      if (error) continue;
      statsByRegion[region.code] = {
        users: typeof count === 'number' ? count : null,
        sessions: typeof count === 'number' ? count : null,
      };
    }
    return statsByRegion;
  }

  const pgPool = getPool();
  if (!pgPool) return statsByRegion;

  const result = await pgPool.query(`
    select region, count(*)::int as sessions, count(distinct identifier)::int as users
    from public.nexbot_usage
    group by region
  `);

  for (const row of result.rows) {
    if (!statsByRegion[row.region]) continue;
    statsByRegion[row.region] = { users: row.users, sessions: row.sessions };
  }

  return statsByRegion;
}

export async function getGtmSettings(ownerEmail) {
  if (supabase) {
    const { data, error } = await supabase
      .from('dashboard_gtm_settings')
      .select('settings')
      .eq('owner_email', ownerEmail)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw new Error(error.message || 'Failed loading GTM settings');
    return normalizeGtm(data?.settings);
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    const result = await pgPool.query('select settings from public.dashboard_gtm_settings where owner_email = $1 limit 1', [ownerEmail]);
    return normalizeGtm(result.rows[0]?.settings);
  }

  const allSettings = await readJsonFile(GTM_FILE, {});
  return normalizeGtm(allSettings[ownerEmail]);
}

export async function saveGtmSettings(ownerEmail, settings) {
  const normalized = normalizeGtm(settings);

  if (supabase) {
    const { error } = await supabase.from('dashboard_gtm_settings').upsert({ owner_email: ownerEmail, settings: normalized, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message || 'Failed saving GTM settings');
    return normalized;
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    await pgPool.query(
      `insert into public.dashboard_gtm_settings (owner_email, settings, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (owner_email) do update set settings = excluded.settings, updated_at = now()`,
      [ownerEmail, JSON.stringify(normalized)],
    );
    return normalized;
  }

  const allSettings = await readJsonFile(GTM_FILE, {});
  allSettings[ownerEmail] = normalized;
  await writeJsonFile(GTM_FILE, allSettings);
  return normalized;
}

export async function getDeployments(ownerEmail) {
  if (supabase) {
    const { data, error } = await supabase
      .from('deployment_requests')
      .select('*')
      .eq('owner_email', ownerEmail)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message || 'Failed loading deployment requests');
    return (data || []).map(row => ({
      id: row.id,
      version: row.version,
      environment: row.environment,
      status: row.status,
      requestedBy: row.requested_by,
      regions: row.regions || [],
      log: row.log || [],
      healthChecks: row.health_checks || [],
      externalUrl: row.external_url || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    const result = await pgPool.query(
      'select * from public.deployment_requests where owner_email = $1 order by created_at desc',
      [ownerEmail],
    );
    if (!result.rows.length) return clone(DEFAULT_DEPLOYMENTS);
    return result.rows.map(row => ({
      id: row.id,
      version: row.version,
      environment: row.environment,
      status: row.status,
      requestedBy: row.requested_by,
      regions: row.regions || [],
      log: row.log || [],
      healthChecks: row.health_checks || [],
      externalUrl: row.external_url || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  const allDeployments = await readJsonFile(DEPLOYMENTS_FILE, {});
  return normalizeDeployments(allDeployments[ownerEmail]);
}

export async function saveDeployment(ownerEmail, deployment) {
  if (supabase) {
    const { error } = await supabase.from('deployment_requests').upsert({
      owner_email: ownerEmail,
      id: deployment.id,
      version: deployment.version,
      environment: deployment.environment,
      status: deployment.status,
      requested_by: deployment.requestedBy,
      regions: deployment.regions,
      log: deployment.log,
      health_checks: deployment.healthChecks,
      external_url: deployment.externalUrl || null,
      created_at: deployment.createdAt,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message || 'Failed saving deployment');
    return deployment;
  }

  const pgPool = getPool();
  if (pgPool) {
    await ensureDashboardTables();
    await pgPool.query(
      `insert into public.deployment_requests (
        owner_email, id, version, environment, status, requested_by, regions, log, health_checks, external_url, created_at, updated_at
      ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, $11, now())
      on conflict (id) do update set
        version = excluded.version,
        environment = excluded.environment,
        status = excluded.status,
        requested_by = excluded.requested_by,
        regions = excluded.regions,
        log = excluded.log,
        health_checks = excluded.health_checks,
        external_url = excluded.external_url,
        updated_at = now()`,
      [
        ownerEmail,
        deployment.id,
        deployment.version,
        deployment.environment,
        deployment.status,
        deployment.requestedBy,
        JSON.stringify(deployment.regions || []),
        JSON.stringify(deployment.log || []),
        JSON.stringify(deployment.healthChecks || []),
        deployment.externalUrl || null,
        deployment.createdAt,
      ],
    );
    return deployment;
  }

  const allDeployments = await readJsonFile(DEPLOYMENTS_FILE, {});
  const items = normalizeDeployments(allDeployments[ownerEmail]);
  const next = [deployment, ...items.filter(item => item.id !== deployment.id)];
  allDeployments[ownerEmail] = next;
  await writeJsonFile(DEPLOYMENTS_FILE, allDeployments);
  return deployment;
}
