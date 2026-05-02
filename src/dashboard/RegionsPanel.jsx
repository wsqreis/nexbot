import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchRegions, updateRegion } from './regionsApi';
import { Card, PageHeader } from './ui';

export default function RegionsPanel() {
  const { getToken } = useAuth();
  const [regions, setRegions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const nextRegions = await fetchRegions(getToken());
        if (!mounted) return;
        setRegions(nextRegions);
        setError('');
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed loading regions');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [getToken]);

  async function persistRegion(code, patch) {
    setSaving(code);
    try {
      const nextRegions = await updateRegion(code, patch, getToken());
      setRegions(nextRegions);
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed saving region');
    } finally {
      setSaving('');
    }
  }

  const activeCount = regions.filter(region => region.status === 'active').length;
  const totalUsers = regions.reduce((sum, region) => sum + (region.users || 0), 0);
  const totalSessions = regions.reduce((sum, region) => sum + (region.sessions || 0), 0);
  const selectedRegion = regions.find(region => region.code === selected) || null;
  const hasStats = regions.some(region => typeof region.users === 'number' || typeof region.sessions === 'number');

  return (
    <div>
      <PageHeader title="Regions" subtitle="Manage chatbot availability across Nordic and international markets." />

      {loading && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Loading region settings…</p>}
      {error && <p style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12 }}>{error}</p>}

      <div style={summaryRow}>
        <StatBox label="Active Regions" value={activeCount} color="#6366f1" />
        <StatBox label={hasStats ? 'Active Identifiers' : 'Active Identifiers'} value={hasStats ? totalUsers.toLocaleString() : '—'} color="#10b981" />
        <StatBox label={hasStats ? 'Tracked Sessions' : 'Tracked Sessions'} value={hasStats ? totalSessions.toLocaleString() : '—'} color="#f59e0b" />
      </div>

      {!hasStats && (
        <p style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
          Usage-derived stats appear when the app is running with a configured database-backed usage store.
        </p>
      )}

      <Card title="Region Management" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {regions.map(region => (
            <div
              key={region.code}
              style={{ ...regionRow, ...(selected === region.code ? { borderColor: '#6366f1', background: '#fafaff' } : {}) }}
              onClick={() => setSelected(selected === region.code ? null : region.code)}
            >
              <span style={{ fontSize: 26 }}>{region.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{region.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{region.lang}</div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {typeof region.users === 'number' ? `${region.users.toLocaleString()} identifiers` : 'Stats unavailable'}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {typeof region.sessions === 'number' ? `${region.sessions.toLocaleString()} sessions` : 'No usage data'}
                </div>
              </div>
              {region.status === 'pending' ? (
                <button
                  style={activateBtn}
                  onClick={event => { event.stopPropagation(); persistRegion(region.code, { status: 'active' }); }}
                  disabled={saving === region.code}
                >
                  {saving === region.code ? 'Saving…' : 'Activate'}
                </button>
              ) : (
                <button
                  style={{ ...toggleBtn, background: region.status === 'active' ? '#d1fae5' : '#f1f5f9', color: region.status === 'active' ? '#065f46' : '#475569' }}
                  onClick={event => {
                    event.stopPropagation();
                    persistRegion(region.code, { status: region.status === 'active' ? 'paused' : 'active' });
                  }}
                  disabled={saving === region.code}
                >
                  {saving === region.code ? 'Saving…' : region.status === 'active' ? '● Active' : '○ Paused'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {selectedRegion && (
        <Card title={`Greeting Preview — ${selectedRegion.name}`} style={{ marginTop: 20 }}>
          <div style={previewBox}>
            <div style={botBubble}>{selectedRegion.greeting}</div>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
            This is what users see when the chatbot opens in this region.
          </p>
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', flex: 1, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const summaryRow = { display: 'flex', gap: 16 };
const regionRow = {
  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
  background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0',
  cursor: 'pointer', transition: 'border-color .15s',
};
const toggleBtn = { border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const activateBtn = { background: '#6366f1', color: 'white', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const previewBox = { background: '#f8fafc', borderRadius: 10, padding: '16px', display: 'flex' };
const botBubble = { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 14, color: '#1e293b', maxWidth: 300, boxShadow: '0 1px 4px rgba(0,0,0,.06)' };
