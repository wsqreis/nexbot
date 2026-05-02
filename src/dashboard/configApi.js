import { fetchChatbotConfig, loadChatbotConfig, persistChatbotConfig } from './chatbotConfigStore';

let configCache = loadChatbotConfig();
let inflightConfigPromise = null;

export function getCachedDashboardConfig() {
  return configCache;
}

export async function loadDashboardConfig(token, force = false) {
  if (!force && inflightConfigPromise) {
    return inflightConfigPromise;
  }

  const promise = fetchChatbotConfig(token)
    .then(config => {
      configCache = config;
      return config;
    })
    .finally(() => {
      inflightConfigPromise = null;
    });

  inflightConfigPromise = promise;
  return promise;
}

export async function saveDashboardConfig(config, token) {
  const saved = await persistChatbotConfig(config, token);
  configCache = saved;
  return saved;
}
