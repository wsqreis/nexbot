import { readJsonBody, readUsers, saveUsers, hashPassword, signToken, sendJson, setCors } from '../authUtils.js';

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
    const users = await readUsers();
    if (users.find(u => u.email === email)) {
      sendJson(res, 409, { error: 'Email already registered' });
      return;
    }

    const hashed = hashPassword(password);
    const user = { name, email, password: hashed, role: 'admin' };
    await saveUsers([...users, user]);

    const token = signToken({ email: user.email, name: user.name, role: user.role });
    sendJson(res, 201, { token, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
  }
}
