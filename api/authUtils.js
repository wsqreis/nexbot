import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const IS_VERCEL = process.env.VERCEL === '1';
export const AUTH_SECRET = process.env.AUTH_SECRET || 'nexbot_dev_secret';
export const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@nexbot.io';
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';
const TOKEN_EXP_SECONDS = Number(process.env.TOKEN_EXP_SECONDS || '3600');

export async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function saveUsers(users) {
  if (IS_VERCEL) {
    const err = new Error('User persistence is not available in Vercel serverless filesystem');
    err.code = 'READ_ONLY_FS';
    throw err;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function base64urlEncode(input) {
  const s = typeof input === 'string' ? input : JSON.stringify(input);
  return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(input) {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + TOKEN_EXP_SECONDS };
  const headerB = base64urlEncode(header);
  const bodyB = base64urlEncode(body);
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(`${headerB}.${bodyB}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${headerB}.${bodyB}.${sig}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB, bodyB, sig] = parts;
    const expected = crypto.createHmac('sha256', AUTH_SECRET).update(`${headerB}.${bodyB}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    // timingSafeEqual requires Buffers of same length
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const bodyJson = base64urlDecode(bodyB);
    const payload = JSON.parse(bodyJson);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return null;
  }
}
