import { useState } from 'react';
import { Card, Field, PageHeader } from './ui';

const DEFAULT_TAGS = [
  { id: 1, name: 'NexBot - Widget Loaded', trigger: 'nexbot_widget_loaded', type: 'Custom Event', status: 'active' },
  { id: 2, name: 'NexBot - Chat Opened', trigger: 'nexbot_opened', type: 'Custom Event', status: 'active' },
  { id: 3, name: 'NexBot - Message Sent', trigger: 'nexbot_message_sent', type: 'Custom Event', status: 'active' },
  { id: 4, name: 'NexBot - Conversion', trigger: 'nexbot_message_received', type: 'Conversion', status: 'paused' },
];

export default function GTMPanel() {
  const [gtmId, setGtmId] = useState('GTM-XXXXXXX');
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [log, setLog] = useState([]);
  const [newTag, setNewTag] = useState({ name: '', trigger: '', type: 'Custom Event' });
  const [firing, setFiring] = useState(null);

  function toggleTag(id) {
    setTags(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === 'active' ? 'paused' : 'active' } : t
    ));
  }

  function addTag() {
    if (!newTag.name || !newTag.trigger) return;
    setTags(prev => [...prev, { ...newTag, id: Date.now(), status: 'active' }]);
    setNewTag({ name: '', trigger: '', type: 'Custom Event' });
  }

  function fireEvent(tag) {
    setFiring(tag.id);
    const entry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      event: tag.trigger,
      status: tag.status === 'active' ? '✅ Fired' : '⏸ Paused',
      tag: tag.name,
    };
    setTimeout(() => {
      setLog(prev => [entry, ...prev.slice(0, 19)]);
      setFiring(null);
      // Push to real dataLayer if GTM is present
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: tag.trigger, nexbot: { source: 'dashboard-test' } });
    }, 700);
  }

  const dataLayerCode = `// GTM Container Snippet (in <head>)
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');

// NexBot pushes events automatically:
// window.dataLayer.push({ event: 'nexbot_opened', nexbot: { botId, region } });`;

  return (
    <div>
      <PageHeader title="GTM & Tracking" subtitle="Configure Google Tag Manager integration, custom tags, and event triggers." />

      <Card title="GTM Container" style={{ marginBottom: 20 }}>
        <Field label="Container ID">
          <input
            style={inp}
            value={gtmId}
            onChange={e => setGtmId(e.target.value)}
            placeholder="GTM-XXXXXXX"
          />
        </Field>
        <pre style={codeStyle}>{dataLayerCode}</pre>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Card title="Custom Tags & Triggers">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {tags.map(tag => (
              <div key={tag.id} style={tagRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{tag.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{tag.trigger}</div>
                </div>
                <span style={{ ...badge, background: tag.type === 'Conversion' ? '#fef3c7' : '#ede9fe', color: tag.type === 'Conversion' ? '#92400e' : '#5b21b6' }}>
                  {tag.type}
                </span>
                <button
                  style={{ ...statusBtn, background: tag.status === 'active' ? '#d1fae5' : '#fee2e2', color: tag.status === 'active' ? '#065f46' : '#991b1b' }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.status}
                </button>
                <button style={testBtn} onClick={() => fireEvent(tag)} disabled={firing === tag.id}>
                  {firing === tag.id ? '…' : 'Test'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Custom Tag</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input style={inp} placeholder="Tag name" value={newTag.name} onChange={e => setNewTag(p => ({ ...p, name: e.target.value }))} />
              <input style={inp} placeholder="Event trigger (e.g. nexbot_lead)" value={newTag.trigger} onChange={e => setNewTag(p => ({ ...p, trigger: e.target.value }))} />
              <select style={inp} value={newTag.type} onChange={e => setNewTag(p => ({ ...p, type: e.target.value }))}>
                <option>Custom Event</option>
                <option>Conversion</option>
                <option>Page View</option>
              </select>
              <button style={addBtn} onClick={addTag}>Add Tag</button>
            </div>
          </div>
        </Card>

        <Card title="Event Log (Live)">
          {log.length === 0 && (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              No events yet. Click "Test" on a tag to fire it.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {log.map(entry => (
              <div key={entry.id} style={logRow}>
                <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{entry.time}</span>
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#6366f1', flex: 1 }}>{entry.event}</span>
                <span style={{ fontSize: 12, color: entry.status.includes('✅') ? '#10b981' : '#f59e0b' }}>{entry.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const inp = {
  width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#0f172a',
  outline: 'none', fontFamily: 'inherit',
};
const codeStyle = {
  background: '#0f172a', color: '#a5b4fc', padding: '12px 16px', borderRadius: 10,
  fontSize: 11.5, fontFamily: 'monospace', overflow: 'auto', lineHeight: 1.65, marginTop: 12,
};
const tagRow = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
  background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
};
const badge = { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap' };
const statusBtn = { fontSize: 10, fontWeight: 600, border: 'none', borderRadius: 20, padding: '3px 10px', cursor: 'pointer', whiteSpace: 'nowrap' };
const testBtn = { background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 };
const logRow = { display: 'flex', gap: 10, alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: 6 };
const addBtn = { background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
