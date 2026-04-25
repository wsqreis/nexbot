import { verifyToken, sendJson, setCors } from '../authUtils.js';

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

  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth || !auth.startsWith('Bearer ')) {
    sendJson(res, 401, { error: 'Authorization required' });
    return;
  }

  const token = auth.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    sendJson(res, 401, { error: 'Invalid or expired token' });
    return;
  }

  sendJson(res, 200, { user: { email: payload.email, name: payload.name, role: payload.role } });
}
