import { readJsonBody, hashPassword, signToken, sendJson, setCors } from '../authUtils.js';
import { createUser } from '../db.js';

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

  // Registration may be disabled in production by setting ALLOW_REGISTRATION=false
  if (process.env.ALLOW_REGISTRATION === 'false' && process.env.NODE_ENV === 'production') {
    sendJson(res, 403, { error: 'Registration disabled' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const { name, email, password } = body || {};
  if (!email || !password || !name) {
    sendJson(res, 400, { error: 'Name, email and password are required' });
    return;
  }

  try {
    const hashed = hashPassword(password);
    const user = await createUser({ name, email, password: hashed, role: 'admin' });

    const token = signToken({ email: user.email, name: user.name, role: user.role });
    sendJson(res, 201, { token, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    if (err && err.code === 'READ_ONLY_FS') {
      sendJson(res, 503, {
        error: 'Registration persistence unavailable in this deployment. Use demo credentials or connect a database.',
      });
      return;
    }

    if (err && err.code === 'DUPLICATE_EMAIL') {
      sendJson(res, 409, { error: 'Email already registered' });
      return;
    }

    sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
  }
}
