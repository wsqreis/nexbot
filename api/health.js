import { sendJson, setCors } from './authUtils.js';
import { getStorageMode, isDatabaseConfigured } from './db.js';

function getRuntime() {
  if (process.env.VERCEL === '1') return 'vercel';
  if (process.env.DOCKER === '1') return 'docker';
  return 'node';
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    provider: 'openai',
    runtime: getRuntime(),
    configured: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      database: isDatabaseConfigured(),
    },
    auth: {
      storage: getStorageMode(),
      registration: process.env.ALLOW_REGISTRATION === 'false' && process.env.NODE_ENV === 'production' ? 'disabled' : 'enabled',
    },
  });
}
