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

export function saveChatbotConfig(config) {
  localStorage.setItem(CHATBOT_CONFIG_KEY, JSON.stringify(config));
}

