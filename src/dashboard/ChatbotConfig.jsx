import { useMemo, useState } from 'react';
import {
  DEFAULT_CHATBOT_CONFIG,
  loadChatbotConfig,
  saveChatbotConfig,
} from './chatbotConfigStore';
import { Card, Field, PageHeader } from './ui';

const THEMES = ['#6366f1', '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const MODEL_OPTIONS = ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

export default function ChatbotConfig() {
  const [config, setConfig] = useState(() => loadChatbotConfig());
  const [saved, setSaved] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() =>
    MODEL_OPTIONS.includes(config.model) ? config.model : 'custom'
  );
  const [customModel, setCustomModel] = useState(() =>
    MODEL_OPTIONS.includes(config.model) ? '' : config.model
  );

  function update(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function save() {
    saveChatbotConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function reset() {
    setConfig(DEFAULT_CHATBOT_CONFIG);
    setSaved(false);
  }

  const snippetCode = useMemo(() => {
    const widgetSrc = getWidgetScriptUrl(config.apiUrl);
    const resolvedApiUrl = getResolvedApiUrl(config.apiUrl);

    const attrs = [
      ['src', widgetSrc],
      ['data-bot-id', config.botId],
      ['data-bot-name', config.botName],
      ['data-greeting', config.greeting],
      ['data-region', 'fi'],
      ['data-theme', config.theme],
      ['data-position', config.position],
      ['data-lang', 'en'],
      ['data-model', config.model],
      ['data-max-tokens', String(config.maxTokens)],
      ['data-system-prompt', config.systemPrompt],
      ['data-api-url', resolvedApiUrl],
    ];

    const lines = attrs.map(([name, value], index) => {
      const suffix = index === attrs.length - 1 ? '>' : '';
      return `  ${name}="${escapeAttr(value)}"${suffix}`;
    });

    return ['<script', ...lines, '</script>'].join('\n');
  }, [config]);

  return (
    <div>
      <PageHeader
        title="Chatbot Configuration"
        subtitle="Configure a real embeddable widget that calls the local chat API through a secure server-side key."
      />

      <div style={styles.grid}>
        <Card title="Widget Identity">
          <Field label="Bot ID">
            <input
              style={styles.input}
              value={config.botId}
              onChange={e => update('botId', e.target.value)}
            />
          </Field>

          <Field label="Bot Name">
            <input
              style={styles.input}
              value={config.botName}
              onChange={e => update('botName', e.target.value)}
            />
          </Field>

          <Field label="Greeting Message">
            <input
              style={styles.input}
              value={config.greeting}
              onChange={e => update('greeting', e.target.value)}
            />
          </Field>

          <Field label="Chat Position">
            <select
              style={styles.input}
              value={config.position}
              onChange={e => update('position', e.target.value)}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
            </select>
          </Field>

          <Field label="Theme Color">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {THEMES.map(color => (
                <button
                  key={color}
                  onClick={() => update('theme', color)}
                  style={{
                    width: 30,
                    height: 30,
                    background: color,
                    border:
                      config.theme === color
                        ? '3px solid #1e293b'
                        : '2px solid transparent',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    outline:
                      config.theme === color ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                  }}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </Field>
        </Card>

        <Card title="Model Settings">
          <Field label="Model">
            <select
              style={styles.input}
              value={selectedModel}
              onChange={e => {
                const v = e.target.value;
                setSelectedModel(v);

                if (v === 'custom') {
                  update('model', customModel || '');
                } else {
                  update('model', v);
                }
              }}
            >
              {MODEL_OPTIONS.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value="custom">Other (custom)</option>
            </select>

            {selectedModel === 'custom' && (
              <input
                style={{ ...styles.input, marginTop: 8 }}
                placeholder="Enter custom model string"
                value={customModel}
                onChange={e => {
                  setCustomModel(e.target.value);
                  update('model', e.target.value);
                }}
              />
            )}
          </Field>

          <Field label="System Prompt">
            <textarea
              style={{
                ...styles.input,
                height: 120,
                resize: 'vertical',
              }}
              value={config.systemPrompt}
              onChange={e => update('systemPrompt', e.target.value)}
            />
          </Field>

          <Field label="Max Output Tokens">
            <input
              style={styles.input}
              type="number"
              min="50"
              max="1200"
              value={config.maxTokens}
              onChange={e => update('maxTokens', Number(e.target.value))}
            />
          </Field>

          <Field label="Chat API URL">
            <input
              style={styles.input}
              value={config.apiUrl}
              onChange={e => update('apiUrl', e.target.value)}
            />
          </Field>

          <p style={styles.hint}>
            The API key is no longer stored in the browser. Set{' '}
            <code>OPENAI_API_KEY</code> on the server running Vite.
          </p>
        </Card>
      </div>

      <Card title="Embed Snippet" style={{ marginTop: 24 }}>
        <p style={styles.hint}>
          Copy this snippet into any page. The widget will read the
          attributes and call the configured API endpoint.
        </p>

        <pre style={styles.code}>{snippetCode}</pre>

        <button
          style={styles.copyBtn}
          onClick={() => navigator.clipboard?.writeText(snippetCode)}
        >
          Copy Snippet
        </button>
      </Card>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <button style={styles.saveBtn} onClick={save}>
          Save Configuration
        </button>

        <button style={styles.secondaryBtn} onClick={reset}>
          Reset Defaults
        </button>

        {saved && (
          <span
            style={{
              color: '#10b981',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Saved locally
          </span>
        )}
      </div>
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
    // fallback se a URL estiver inválida
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${widgetPath}`;
  }

  return widgetPath;
}

function getResolvedApiUrl(apiUrl) {
  const apiPath = '/api/chat';

  try {
    if (typeof apiUrl === 'string' && /^https?:\/\//i.test(apiUrl)) {
      return new URL(apiPath, apiUrl).toString();
    }
  } catch {
    // fallback se vier URL inválida
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${apiPath}`;
  }

  return apiPath;
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },

  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13.5,
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
  },

  hint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 1.5,
  },

  code: {
    background: '#0f172a',
    color: '#a5b4fc',
    padding: '14px 18px',
    borderRadius: 10,
    fontSize: 12.5,
    fontFamily: 'monospace',
    overflow: 'auto',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },

  copyBtn: {
    marginTop: 10,
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
    fontWeight: 500,
  },

  saveBtn: {
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '11px 24px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },

  secondaryBtn: {
    background: '#f8fafc',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '11px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
