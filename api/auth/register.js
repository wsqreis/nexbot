import { readJsonBody, readUsers, saveUsers, hashPassword, signToken, sendJson, setCors } from '../authUtils.js';
import { supabase } from '../supabase.js';

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
    let user = { name, email, password: hashed, role: 'admin' };

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
        sendJson(res, 409, { error: 'Email already registered' });
        return;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .insert([{ name, email, password: hashed, role: 'admin' }])
        .select('name, email, role')
        .single();

      if (insertErr) {
        throw new Error(insertErr.message || 'Failed creating user');
      }

      user = { name: inserted.name, email: inserted.email, role: inserted.role || 'admin' };
    } else {
      const users = await readUsers();
      if (users.find(u => u.email === email)) {
        sendJson(res, 409, { error: 'Email already registered' });
        return;
      }

      await saveUsers([...users, user]);
    }

    const token = signToken({ email: user.email, name: user.name, role: user.role });
    sendJson(res, 201, { token, user: { email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    if (err && err.code === 'READ_ONLY_FS') {
      sendJson(res, 503, {
        error: 'Registration persistence unavailable in this deployment. Use demo credentials or connect a database.',
      });
      return;
    }
    sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
  }
}
