import { useState } from 'react';
import { Card, PageHeader } from './ui';

const STEPS_STAGING = [
  'Running unit tests…',
  'Building widget bundle…',
  'Running end-to-end tests…',
  'Uploading to staging CDN…',
  'Running smoke tests on staging…',
  '✅ Staging deployment complete!',
];

const STEPS_PROD = [
  'Verifying staging approval…',
  'Creating production snapshot…',
  'Running security checks…',
  'Deploying to production CDN (fi, sv, no)…',
  'Invalidating CDN cache…',
  'Verifying health endpoints…',
  '✅ Production deployment complete!',
];

const DEPLOY_HISTORY = [
  { id: 'v1.3.2', env: 'production', date: '2025-05-14 14:22', status: 'success', by: 'Wesley Reis', regions: ['fi', 'sv', 'no'] },
  { id: 'v1.3.1', env: 'staging',    date: '2025-05-14 13:45', status: 'success', by: 'Wesley Reis', regions: ['fi', 'sv', 'no'] },
  { id: 'v1.3.0', env: 'production', date: '2025-05-12 10:11', status: 'success', by: 'Wesley Reis', regions: ['fi', 'sv'] },
  { id: 'v1.2.9', env: 'staging',    date: '2025-05-11 16:30', status: 'failed',  by: 'Wesley Reis', regions: ['fi'] },
];

export default function DeployPanel() {
  const [stagingLog, setStagingLog]   = useState([]);
  const [prodLog, setProdLog]         = useState([]);
  const [stagingDone, setStagingDone] = useState(false);
  const [prodDone, setProdDone]       = useState(false);
  const [running, setRunning]         = useState(null);
  const [version, setVersion]         = useState('v1.3.3');

  async function runDeploy(type) {
    if (running) return;
    setRunning(type);
    const steps = type === 'staging' ? STEPS_STAGING : STEPS_PROD;
    if (type === 'staging') { setStagingLog([]); setStagingDone(false); }
    else                    { setProdLog([]);    setProdDone(false); }

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
      if (type === 'staging') setStagingLog(prev => [...prev, steps[i]]);
      else                    setProdLog(prev => [...prev, steps[i]]);
    }
    if (type === 'staging') setStagingDone(true);
    else                    setProdDone(true);
    setRunning(null);
  }

  return (
    <div>
      <PageHeader title="Deploy" subtitle="Manage staging and production deployments across all regions." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Staging */}
        <Card title="Staging Deployment">
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Version tag</label>
            <input style={inp} value={version} onChange={e => setVersion(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Target regions</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['🇫🇮 fi', '🇸🇪 sv', '🇳🇴 no'].map(r => (
                <span key={r} style={regionTag}>{r}</span>
              ))}
            </div>
          </div>
          <button
            style={{ ...deployBtn, background: '#0ea5e9', opacity: running ? .6 : 1 }}
            onClick={() => runDeploy('staging')}
            disabled={!!running}
          >
            {running === 'staging' ? '⏳ Deploying…' : '🚀 Deploy to Staging'}
          </button>

          {stagingLog.length > 0 && (
            <div style={logBox}>
              {stagingLog.map((line, i) => (
                <div key={i} style={{ color: line.startsWith('✅') ? '#4ade80' : '#94a3b8', fontSize: 12 }}>
                  {!line.startsWith('✅') && <span style={{ color: '#6366f1', marginRight: 6 }}>{'>'}</span>}
                  {line}
                </div>
              ))}
              {stagingDone && <div style={{ marginTop: 6, color: '#0ea5e9', fontSize: 12 }}>🔗 https://staging.nexbot.io/widget/nexbot.js</div>}
            </div>
          )}
        </Card>

        {/* Production */}
        <Card title="Production Deployment">
          <div style={{ ...alertBox, ...(stagingDone ? {} : { opacity: .6 }) }}>
            {stagingDone
              ? '✅ Staging approved. Ready for production.'
              : '⚠️ Deploy and approve staging first.'}
          </div>
          <div style={{ marginBottom: 14, marginTop: 14 }}>
            <label style={lbl}>Environment</label>
            <select style={inp}><option>production</option></select>
          </div>
          <button
            style={{ ...deployBtn, background: stagingDone ? '#6366f1' : '#94a3b8', opacity: running || !stagingDone ? .6 : 1 }}
            onClick={() => runDeploy('production')}
            disabled={!!running || !stagingDone}
          >
            {running === 'production' ? '⏳ Deploying…' : '🚀 Deploy to Production'}
          </button>

          {prodLog.length > 0 && (
            <div style={logBox}>
              {prodLog.map((line, i) => (
                <div key={i} style={{ color: line.startsWith('✅') ? '#4ade80' : '#94a3b8', fontSize: 12 }}>
                  {!line.startsWith('✅') && <span style={{ color: '#6366f1', marginRight: 6 }}>{'>'}</span>}
                  {line}
                </div>
              ))}
              {prodDone && <div style={{ marginTop: 6, color: '#4ade80', fontSize: 12 }}>🔗 https://cdn.nexbot.io/widget/nexbot.js</div>}
            </div>
          )}
        </Card>
      </div>

      {/* History */}
      <Card title="Deployment History">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DEPLOY_HISTORY.map(d => (
            <div key={d.id + d.date} style={historyRow}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0f172a', minWidth: 60 }}>{d.id}</span>
              <span style={{ ...envBadge, background: d.env === 'production' ? '#ede9fe' : '#dbeafe', color: d.env === 'production' ? '#5b21b6' : '#1d4ed8' }}>
                {d.env}
              </span>
              <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{d.date}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{d.by}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {d.regions.map(r => <span key={r} style={regionTag}>{r}</span>)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: d.status === 'success' ? '#10b981' : '#ef4444' }}>
                {d.status === 'success' ? '✓ success' : '✗ failed'}
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
const logBox = { marginTop: 14, background: '#0f172a', borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflow: 'auto' };
const alertBox = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' };
const historyRow = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' };
const envBadge = { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20 };
const regionTag = { background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '2px 7px', borderRadius: 10, fontWeight: 500 };
