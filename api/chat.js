const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gpt-4.1-mini';

import { countRecentUsage, recordUsage } from './db.js';
import { supabase } from './supabase.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getTextFromResponse(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('\n')
    .trim();

  return text || null;
}

function normalizeHistory(history = []) {
  return history
    .filter(item => item && typeof item.content === 'string' && item.content.trim())
    .slice(-10)
    .map(item => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim(),
    }));
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function getUserFromAuthHeader(req) {
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

async function moderateMessage(message) {
  if (!process.env.OPENAI_API_KEY) return { ok: true };
  try {
    const resp = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ input: message }),
    });
    const data = await resp.json();
    const flagged = !!(data && data.results && data.results[0] && data.results[0].flagged);
    return { ok: !flagged, details: data };
  } catch {
    return { ok: true };
  }
}

async function checkRateLimit(identifier) {
  const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SECONDS || '60');
  const limit = Number(process.env.RATE_LIMIT_PER_WINDOW || '20');
  const since = new Date(Date.now() - windowSec * 1000).toISOString();

  try {
    const count = await countRecentUsage(identifier, since);
    if (typeof count !== 'number') return { ok: true };
    if (count >= limit) return { ok: false, retryAfter: windowSec };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 503, { error: 'OPENAI_API_KEY is not configured' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const {
    message,
    history = [],
    systemPrompt = 'You are a helpful assistant.',
    model,
    maxTokens = 300,
  } = body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    sendJson(res, 400, { error: 'Message is required' });
    return;
  }
  const effectiveModel = model || DEFAULT_MODEL;

  // Identify user (from Authorization header or sessionToken fallback)
  const user = await getUserFromAuthHeader(req);
  const identifier = user?.email || (body && body.sessionToken) || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';

  // If REQUIRE_AUTH=true enforce authentication
  if (process.env.REQUIRE_AUTH === 'true' && !user) {
    sendJson(res, 401, { error: 'Authentication required' });
    return;
  }

  // Moderation check
  const mod = await moderateMessage(message.trim());
  if (!mod.ok) {
    sendJson(res, 403, { error: 'Message violates content policy', details: mod.details });
    return;
  }

  // Rate limiting
  const rl = await checkRateLimit(identifier);
  if (!rl.ok) {
    sendJson(res, 429, { error: 'Rate limit exceeded', retry_after: rl.retryAfter || 60 });
    return;
  }

  const input = [
    ...normalizeHistory(history).map(item => ({
      role: item.role,
      content: [{ type: 'input_text', text: item.content }],
    })),
    {
      role: 'user',
      content: [{ type: 'input_text', text: message.trim() }],
    },
  ];

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: effectiveModel,
        input,
        instructions: `${systemPrompt}\n\nModel: ${effectiveModel}`,
        max_output_tokens: Number(maxTokens) || 300,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      sendJson(res, upstream.status, { error: data?.error?.message || 'OpenAI request failed' });
      return;
    }

    const reply = getTextFromResponse(data) || 'Sorry, I could not generate a response.';

    recordUsage({
      identifier,
      bot_id: body.botId || 'unknown',
      region: body.region || 'unknown',
      model: effectiveModel,
      meta: { authenticated: Boolean(user) },
      created_at: new Date().toISOString(),
    });

    sendJson(res, 200, { reply, model: data.model || effectiveModel, id: data.id });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unexpected server error' });
  }
}
