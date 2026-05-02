import { readJsonBody, sendJson } from '../authUtils.js';
import { getRegionStats, getRegions, saveRegion } from '../db.js';
import { handleOptions, requireDashboardUser } from './_auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res, 'GET, PUT, OPTIONS')) return;

  const user = requireDashboardUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const [regions, stats] = await Promise.all([
        getRegions(user.email),
        getRegionStats(user.email),
      ]);

      const merged = regions.map(region => ({
        ...region,
        users: stats[region.code]?.users,
        sessions: stats[region.code]?.sessions,
      }));

      sendJson(res, 200, { regions: merged });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed loading regions' });
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

    const code = body?.code;
    if (!code) {
      sendJson(res, 400, { error: 'Region code is required' });
      return;
    }

    try {
      const regions = await saveRegion(user.email, code, body.patch || {});
      const stats = await getRegionStats(user.email);
      const merged = regions.map(region => ({
        ...region,
        users: stats[region.code]?.users,
        sessions: stats[region.code]?.sessions,
      }));
      sendJson(res, 200, { regions: merged });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed saving region' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
