import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Card, PageHeader } from './ui';
import { getCachedDashboardConfig, loadDashboardConfig } from './configApi';

export default function LivePreview() {
  const { getToken } = useAuth();
  const [savedConfig, setSavedConfig] = useState(() => getCachedDashboardConfig());
  const [region, setRegion] = useState('fi');
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState(savedConfig.theme);
  const [position, setPosition] = useState(savedConfig.position);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const config = await loadDashboardConfig(getToken(), true);
        if (!mounted) return;
        setSavedConfig(config);
        setTheme(config.theme);
        setPosition(config.position);
        setError('');
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Failed loading saved config');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [getToken]);

  const embedSnippet = useMemo(() => {
    const widgetSrc = getWidgetScriptUrl(savedConfig.apiUrl);
    const attrs = [
      ['src', widgetSrc],
      ['data-bot-id', savedConfig.botId],
      ['data-bot-name', savedConfig.botName],
      ['data-greeting', savedConfig.greeting],
      ['data-region', region],
      ['data-theme', theme],
      ['data-position', position],
      ['data-lang', lang],
      ['data-model', savedConfig.model],
      ['data-max-tokens', String(savedConfig.maxTokens)],
      ['data-system-prompt', savedConfig.systemPrompt],
      ['data-api-url', savedConfig.apiUrl],
    ];

    return ['<script', ...attrs.map(([name, value], index) => `  ${name}="${escapeAttr(value)}"${index === attrs.length - 1 ? '>' : ''}`), '</script>'].join('\n');
  }, [lang, position, region, savedConfig, theme]);

  const previewHtml = useMemo(() => {
    const scriptSrc = `${window.location.origin}/widget/nexbot.js`;
    const attrs = [
      ['src', scriptSrc],
      ['data-bot-id', savedConfig.botId],
      ['data-bot-name', savedConfig.botName],
      ['data-greeting', savedConfig.greeting],
      ['data-region', region],
      ['data-theme', theme],
      ['data-position', position],
      ['data-lang', lang],
      ['data-model', savedConfig.model],
      ['data-max-tokens', String(savedConfig.maxTokens)],
      ['data-system-prompt', savedConfig.systemPrompt],
      ['data-api-url', savedConfig.apiUrl],
    ]
      .map(([name, value]) => `${name}="${escapeAttr(value)}"`)
      .join('\n        ');

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top right, rgba(99, 102, 241, 0.20), transparent 28%),
          linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        font-family: "Segoe UI", sans-serif;
        color: #334155;
      }
      .page {
        padding: 40px;
      }
      .hero {
        width: min(640px, 100%);
      }
      .eyebrow {
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6366f1;
        margin-bottom: 16px;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 38px;
        line-height: 1.05;
        color: #0f172a;
      }
      p {
        margin: 0;
        max-width: 560px;
        font-size: 15px;
        line-height: 1.7;
      }
      .card {
        margin-top: 28px;
        width: min(520px, 100%);
        padding: 18px 20px;
        border-radius: 18px;
        background: rgba(255,255,255,0.72);
        border: 1px solid rgba(148,163,184,0.2);
        backdrop-filter: blur(8px);
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="hero">
        <span class="eyebrow">Live Widget Preview</span>
        <h1>${escapeHtml(savedConfig.botName)}</h1>
        <p>This preview uses the same embeddable script that a host site would use. If <code>OPENAI_API_KEY</code> is configured on the Vite server, messages will go through the real chat endpoint.</p>
        <div class="card">
          Region: ${escapeHtml(region.toUpperCase())} | Language: ${escapeHtml(lang)} | Model: ${escapeHtml(savedConfig.model)}
        </div>
      </div>
    </div>
    <script
        ${attrs}
      ></script>
  </body>
</html>`;
  }, [lang, position, region, savedConfig, theme]);

  return (
    <div>
      <PageHeader title="Live Preview" subtitle="This panel now renders the real embeddable widget inside an isolated preview page." />

      {loading && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Loading saved configuration…</p>}
      {error && <p style={{ fontSize: 13, color: '#b91c1c', marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Preview Settings">
            <Field label="Region">
              <select style={inp} value={region} onChange={e => setRegion(e.target.value)}>
                <option value="fi">Finland</option>
                <option value="sv">Sweden</option>
                <option value="no">Norway</option>
                <option value="en">International</option>
              </select>
            </Field>
            <Field label="Language">
              <select style={inp} value={lang} onChange={e => setLang(e.target.value)}>
                <option value="en">English</option>
                <option value="fi">Finnish</option>
                <option value="sv">Swedish</option>
                <option value="no">Norwegian</option>
              </select>
            </Field>
            <Field label="Position">
              <select style={inp} value={position} onChange={e => setPosition(e.target.value)}>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </Field>
            <Field label="Theme">
              <input
                type="color"
                style={{ width: '100%', height: 38, borderRadius: 8, border: '1.5px solid #e2e8f0', padding: 2, cursor: 'pointer', background: '#f8fafc' }}
                value={theme}
                onChange={e => setTheme(e.target.value)}
              />
            </Field>
            <button style={refreshBtn} onClick={() => setRefreshKey(prev => prev + 1)}>Reload Preview</button>
          </Card>

          <Card title="Embed Code">
            <pre style={codeStyle}>{embedSnippet}</pre>
            <button style={copyBtn} onClick={() => navigator.clipboard?.writeText(embedSnippet)}>Copy</button>
          </Card>
        </div>

        <Card title="Widget Preview" style={{ padding: 0, overflow: 'hidden' }}>
          <iframe
            key={refreshKey}
            title="NexBot live preview"
            srcDoc={previewHtml}
            style={{ width: '100%', height: 560, border: 'none', background: '#f8fafc' }}
          />
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getWidgetScriptUrl(apiUrl) {
  const widgetPath = '/widget/nexbot.js';

  try {
    if (typeof apiUrl === 'string' && /^https?:\/\//i.test(apiUrl)) {
      return new URL(widgetPath, apiUrl).toString();
    }
  } catch {
    // Fall back to current origin if apiUrl is malformed.
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${widgetPath}`;
  }

  return widgetPath;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const inp = { width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 11px', fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: 'inherit' };
const refreshBtn = { background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 4 };
const codeStyle = { background: '#0f172a', color: '#a5b4fc', padding: '10px 12px', borderRadius: 8, fontSize: 10.5, fontFamily: 'monospace', overflow: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap' };
const copyBtn = { marginTop: 8, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 500 };
