import { readJsonBody, sendJson } from '../authUtils.js';
import { getGtmSettings, saveGtmSettings } from '../db.js';
import { handleOptions, requireDashboardUser } from './_auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res, 'GET, PUT, OPTIONS')) return;

  const user = requireDashboardUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const settings = await getGtmSettings(user.email);
      sendJson(res, 200, { settings });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed loading GTM settings' });
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
      const settings = await saveGtmSettings(user.email, body?.settings || {});
      sendJson(res, 200, { settings });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed saving GTM settings' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
