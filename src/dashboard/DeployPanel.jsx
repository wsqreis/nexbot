import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { approveDeployment, checkDeploymentHealth, createDeployment, fetchDeployments } from './deploymentsApi';
import { Card, PageHeader } from './ui';

const DEFAULT_REGIONS = ['fi', 'sv', 'no'];

export default function DeployPanel() {
  const { getToken } = useAuth();
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const [version, setVersion] = useState('v1.3.3');
  const [externalUrl, setExternalUrl] = useState('http://localhost:3000');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const items = await fetchDeployments(getToken());
        if (!mounted) return;
        setDeployments(items);
        setError('');
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed loading deployments');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [getToken]);

  const latestStaging = useMemo(
    () => deployments.find(deployment => deployment.environment === 'staging') || null,
    [deployments],
  );
  const latestProduction = useMemo(
    () => deployments.find(deployment => deployment.environment === 'production') || null,
    [deployments],
  );

  async function requestDeployment(environment) {
    setSaving(environment);
    try {
      const items = await createDeployment({
        version,
        environment,
        regions: DEFAULT_REGIONS,
        externalUrl,
      }, getToken());
      setDeployments(items);
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed creating deployment request');
    } finally {
      setSaving('');
    }
  }

  async function approveLatestProduction() {
    if (!latestProduction) return;
    setSaving(`approve-${latestProduction.id}`);
    try {
      const items = await approveDeployment(latestProduction.id, getToken());
      setDeployments(items);
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed approving deployment');
    } finally {
      setSaving('');
    }
  }

  async function runHealthCheck(deployment) {
    setSaving(`health-${deployment.id}`);
    try {
      const result = await checkDeploymentHealth(deployment.id, deployment.externalUrl || externalUrl, getToken());
      setDeployments(result.deployments);
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed running health check');
    } finally {
      setSaving('');
    }
  }

  return (
    <div>
      <PageHeader title="Deploy" subtitle="Track deployment requests, approvals, and health checks without pretending to own external CI/CD." />

      {loading && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Loading deployment activity…</p>}
      {error && <p style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card title="Staging Request">
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Version tag</label>
            <input style={inp} value={version} onChange={event => setVersion(event.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Target URL for health checks</label>
            <input style={inp} value={externalUrl} onChange={event => setExternalUrl(event.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Target regions</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {DEFAULT_REGIONS.map(region => (
                <span key={region} style={regionTag}>{region}</span>
              ))}
            </div>
          </div>
          <button
            style={{ ...deployBtn, background: '#0ea5e9', opacity: saving ? 0.6 : 1 }}
            onClick={() => requestDeployment('staging')}
            disabled={Boolean(saving)}
          >
            {saving === 'staging' ? 'Saving…' : 'Request Staging Deploy'}
          </button>

          {latestStaging && (
            <div style={logBox}>
              {latestStaging.log.map((line, index) => (
                <div key={`${latestStaging.id}-log-${index}`} style={{ color: '#94a3b8', fontSize: 12 }}>{line}</div>
              ))}
              <div style={{ marginTop: 6, color: '#0ea5e9', fontSize: 12 }}>
                Status: {latestStaging.status}
              </div>
            </div>
          )}
        </Card>

        <Card title="Production Request">
          <div style={alertBox}>
            {latestProduction
              ? `Latest production request status: ${latestProduction.status}`
              : 'No production requests yet.'}
          </div>
          <div style={{ marginBottom: 14, marginTop: 14 }}>
            <label style={lbl}>Environment</label>
            <select style={inp} value="production" readOnly>
              <option>production</option>
            </select>
          </div>
          <button
            style={{ ...deployBtn, background: '#6366f1', opacity: saving ? 0.6 : 1 }}
            onClick={() => requestDeployment('production')}
            disabled={Boolean(saving)}
          >
            {saving === 'production' ? 'Saving…' : 'Request Production Deploy'}
          </button>

          {latestProduction && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                style={{ ...smallBtn, background: '#10b981', color: 'white' }}
                onClick={approveLatestProduction}
                disabled={saving === `approve-${latestProduction.id}`}
              >
                {saving === `approve-${latestProduction.id}` ? 'Saving…' : 'Approve'}
              </button>
              <button
                style={{ ...smallBtn, background: '#0f172a', color: 'white' }}
                onClick={() => runHealthCheck(latestProduction)}
                disabled={saving === `health-${latestProduction.id}`}
              >
                {saving === `health-${latestProduction.id}` ? 'Checking…' : 'Run Health Check'}
              </button>
            </div>
          )}
        </Card>
      </div>

      <Card title="Deployment History">
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          This panel stores deployment requests, approvals, and health checks in the app. External deployment execution still needs real CI/CD or platform integration.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deployments.map(deployment => (
            <div key={deployment.id} style={historyRow}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a', minWidth: 60 }}>{deployment.version}</span>
              <span style={{ ...envBadge, background: deployment.environment === 'production' ? '#ede9fe' : '#dbeafe', color: deployment.environment === 'production' ? '#5b21b6' : '#1d4ed8' }}>
                {deployment.environment}
              </span>
              <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{new Date(deployment.createdAt).toLocaleString()}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{deployment.requestedBy}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(deployment.regions || []).map(region => <span key={`${deployment.id}-${region}`} style={regionTag}>{region}</span>)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: deployment.status === 'failed' ? '#ef4444' : '#10b981' }}>
                {deployment.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const lbl = { fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 };
const inp = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'inherit' };
const deployBtn = { color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 4 };
const smallBtn = { border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' };
const logBox = { marginTop: 14, background: '#0f172a', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflow: 'auto' };
const alertBox = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' };
const historyRow = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' };
const envBadge = { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 };
const regionTag = { background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 500 };
