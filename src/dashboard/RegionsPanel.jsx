import { useState } from 'react';
import { Card, PageHeader } from './ui';

const REGIONS = [
  { code: 'fi', flag: '🇫🇮', name: 'Finland', lang: 'Finnish', status: 'active', users: 1240, sessions: 4821 },
  { code: 'sv', flag: '🇸🇪', name: 'Sweden',  lang: 'Swedish', status: 'active', users: 2103, sessions: 7654 },
  { code: 'no', flag: '🇳🇴', name: 'Norway',  lang: 'Norwegian', status: 'active', users: 980, sessions: 3190 },
  { code: 'dk', flag: '🇩🇰', name: 'Denmark', lang: 'Danish', status: 'pending', users: 0, sessions: 0 },
  { code: 'en', flag: '🌐', name: 'International', lang: 'English', status: 'active', users: 5400, sessions: 18920 },
];

const GREETINGS = {
  fi: "Hei! Kuinka voin auttaa sinua tänään?",
  sv: "Hej! Hur kan jag hjälpa dig idag?",
  no: "Hei! Hvordan kan jeg hjelpe deg i dag?",
  dk: "Hej! Hvordan kan jeg hjælpe dig i dag?",
  en: "Hi! How can I help you today?",
};

export default function RegionsPanel() {
  const [regions, setRegions] = useState(REGIONS);
  const [selected, setSelected] = useState(null);

  function toggleRegion(code) {
    setRegions(prev => prev.map(r =>
      r.code === code ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
    ));
  }

  function activatePending(code) {
    setRegions(prev => prev.map(r =>
      r.code === code ? { ...r, status: 'active' } : r
    ));
  }

  const activeCount = regions.filter(r => r.status === 'active').length;
  const totalUsers  = regions.reduce((sum, r) => sum + r.users, 0);

  return (
    <div>
      <PageHeader title="Regions" subtitle="Manage chatbot availability across Nordic and international markets." />

      <div style={summaryRow}>
        <StatBox label="Active Regions" value={activeCount} color="#6366f1" />
        <StatBox label="Total Users" value={totalUsers.toLocaleString()} color="#10b981" />
        <StatBox label="Total Sessions" value={regions.reduce((s, r) => s + r.sessions, 0).toLocaleString()} color="#f59e0b" />
      </div>

      <Card title="Region Management" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {regions.map(r => (
            <div
              key={r.code}
              style={{ ...regionRow, ...(selected === r.code ? { borderColor: '#6366f1', background: '#fafaff' } : {}) }}
              onClick={() => setSelected(selected === r.code ? null : r.code)}
            >
              <span style={{ fontSize: 26 }}>{r.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{r.lang}</div>
              </div>
              <div style={{ textAlign: 'right', marginRight: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{r.users.toLocaleString()} users</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.sessions.toLocaleString()} sessions</div>
              </div>
              {r.status === 'pending' ? (
                <button
                  style={activateBtn}
                  onClick={e => { e.stopPropagation(); activatePending(r.code); }}
                >
                  Activate
                </button>
              ) : (
                <button
                  style={{ ...toggleBtn, background: r.status === 'active' ? '#d1fae5' : '#f1f5f9', color: r.status === 'active' ? '#065f46' : '#475569' }}
                  onClick={e => { e.stopPropagation(); toggleRegion(r.code); }}
                >
                  {r.status === 'active' ? '● Active' : '○ Paused'}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {selected && (
        <Card title={`Greeting Preview — ${REGIONS.find(r => r.code === selected)?.name}`} style={{ marginTop: 20 }}>
          <div style={previewBox}>
            <div style={botBubble}>{GREETINGS[selected]}</div>
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
