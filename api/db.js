import { Pool } from 'pg';
import { supabase } from './supabase.js';
import { readUsers, saveUsers } from './authUtils.js';

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_SSL = process.env.DATABASE_SSL;

let pool;

function shouldUseSsl(connectionString) {
  if (DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  if (DATABASE_SSL === 'false') return false;

  try {
    const { hostname } = new URL(connectionString);
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'postgres') {
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
