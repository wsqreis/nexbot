export const CHATBOT_CONFIG_KEY = 'nexbot_config';

export const DEFAULT_CHATBOT_CONFIG = {
  botId: 'my-bot',
  botName: 'NexBot Assistant',
  greeting: 'Hi! How can I help you today?',
  theme: '#6366f1',
  position: 'bottom-right',
  model: 'gpt-4.1-mini',
  systemPrompt: 'You are a helpful customer support assistant for a Nordic energy company. Be concise, friendly, and practical.',
  maxTokens: 300,
  apiUrl: '/api/chat',
};

export function loadChatbotConfig() {
  try {
    const raw = localStorage.getItem(CHATBOT_CONFIG_KEY);
    return raw ? { ...DEFAULT_CHATBOT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CHATBOT_CONFIG;
  } catch {
    return DEFAULT_CHATBOT_CONFIG;
  }
}

export function saveLocalChatbotConfig(config) {
  localStorage.setItem(CHATBOT_CONFIG_KEY, JSON.stringify(config));
}

export async function fetchChatbotConfig(token) {
  const res = await fetch('/api/dashboard/config', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed loading chatbot config');
  }

  const data = await res.json();
  const config = { ...DEFAULT_CHATBOT_CONFIG, ...(data.config || {}) };
  saveLocalChatbotConfig(config);
  return config;
}

export async function persistChatbotConfig(config, token) {
  const res = await fetch('/api/dashboard/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ config }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed saving chatbot config');
  }

  const data = await res.json();
  const savedConfig = { ...DEFAULT_CHATBOT_CONFIG, ...(data.config || {}) };
  saveLocalChatbotConfig(savedConfig);
  return savedConfig;
}
