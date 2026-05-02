import { sendJson, setCors, verifyToken } from '../authUtils.js';

export function handleOptions(req, res, methods = 'GET, PUT, POST, OPTIONS') {
  if (req.method !== 'OPTIONS') return false;
  setCors(res);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.statusCode = 204;
  res.end();
  return true;
}

export function getDashboardUser(req) {
  const auth = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
  return verifyToken(token);
}

export function requireDashboardUser(req, res) {
  const user = getDashboardUser(req);
  if (!user) {
    sendJson(res, 401, { error: 'Authorization required' });
    return null;
  }
  return user;
}
