import { readJsonBody, hashPassword, signToken, sendJson, setCors, DEMO_EMAIL, DEMO_PASSWORD } from '../authUtils.js';
import { findUserByEmail } from '../db.js';

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

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const { email, password } = body || {};
  if (!email || !password) {
    sendJson(res, 400, { error: 'Email and password are required' });
    return;
  }

  try {
    const hashed = hashPassword(password);
    let user = await findUserByEmail(email);

    if (!user) {
      // Allow demo fallback when server has no stored user
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        user = { email: DEMO_EMAIL, name: 'Demo User', role: 'admin' };
      } else {
        sendJson(res, 401, { error: 'Invalid credentials' });
        return;
      }
    } else {
      if (user.password !== hashed) {
        sendJson(res, 401, { error: 'Invalid credentials' });
        return;
      }
    }

    const token = signToken({ email: user.email, name: user.name || user.email, role: user.role || 'user' });
    sendJson(res, 200, { token, user: { email: user.email, name: user.name || user.email, role: user.role || 'user' } });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
  }
}
