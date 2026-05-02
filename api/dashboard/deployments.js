import { readJsonBody, sendJson } from '../authUtils.js';
import { getDeployments, saveDeployment } from '../db.js';
import { handleOptions, requireDashboardUser } from './_auth.js';

function buildDeploymentId(version, environment) {
  return `${version}-${environment}-${Date.now()}`;
}

async function runHealthCheck(targetUrl) {
  if (!targetUrl) {
    return {
      ok: false,
      status: 0,
      checkedAt: new Date().toISOString(),
      targetUrl: '',
      message: 'No target URL configured',
    };
  }

  try {
    const url = new URL('/api/health', targetUrl).toString();
    const response = await fetch(url);
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok && data?.ok === true,
      status: response.status,
      checkedAt: new Date().toISOString(),
      targetUrl: url,
      message: response.ok ? 'Health check completed' : (data?.error || 'Health check failed'),
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      checkedAt: new Date().toISOString(),
      targetUrl,
      message: error instanceof Error ? error.message : 'Health check failed',
    };
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res, 'GET, POST, OPTIONS')) return;

  const user = requireDashboardUser(req, res);
  if (!user) return;

  if (req.method === 'GET') {
    try {
      const deployments = await getDeployments(user.email);
      sendJson(res, 200, { deployments });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed loading deployments' });
    }
    return;
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    try {
      const action = body?.action || 'request';

      if (action === 'request') {
        const deployment = {
          id: buildDeploymentId(body.version || 'draft', body.environment || 'staging'),
          version: body.version || 'draft',
          environment: body.environment || 'staging',
          status: body.environment === 'production' ? 'requested' : 'ready',
          requestedBy: user.name || user.email,
          regions: Array.isArray(body.regions) ? body.regions : [],
          log: [`${new Date().toISOString()}: Deployment request created`],
          healthChecks: [],
          externalUrl: body.externalUrl || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveDeployment(user.email, deployment);
        const deployments = await getDeployments(user.email);
        sendJson(res, 201, { deployments, deployment });
        return;
      }

      const deployments = await getDeployments(user.email);
      const current = deployments.find(deployment => deployment.id === body.id);
      if (!current) {
        sendJson(res, 404, { error: 'Deployment not found' });
        return;
      }

      if (action === 'approve') {
        const next = {
          ...current,
          status: 'approved',
          log: [...(current.log || []), `${new Date().toISOString()}: Approved for production`],
          updatedAt: new Date().toISOString(),
        };
        await saveDeployment(user.email, next);
        sendJson(res, 200, { deployments: await getDeployments(user.email), deployment: next });
        return;
      }

      if (action === 'health-check') {
        const result = await runHealthCheck(current.externalUrl || body.externalUrl);
        const next = {
          ...current,
          status: result.ok ? 'healthy' : current.status,
          healthChecks: [result, ...(current.healthChecks || [])].slice(0, 10),
          log: [...(current.log || []), `${result.checkedAt}: ${result.message}`],
          externalUrl: current.externalUrl || body.externalUrl || '',
          updatedAt: new Date().toISOString(),
        };
        await saveDeployment(user.email, next);
        sendJson(res, 200, { deployments: await getDeployments(user.email), deployment: next, healthCheck: result });
        return;
      }

      sendJson(res, 400, { error: 'Unsupported deployment action' });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed saving deployment' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}
