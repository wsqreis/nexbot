import { readJsonBody, sendJson } from '../authUtils.js';
import { getDashboardConfig, saveDashboardConfig } from '../db.js';
import { handleOptions, requireDashboardUser } from './_auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res, 'GET, PUT, OPTIONS')) return;

  const user = requireDashboardUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const config = await getDashboardConfig(user.email);
      sendJson(res, 200, { config });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed loading dashboard config' });
    }
    return;
  }

  if (req.method === 'PUT') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    try {
      const config = await saveDashboardConfig(user.email, body?.config || {});
      sendJson(res, 200, { config });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed saving dashboard config' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
