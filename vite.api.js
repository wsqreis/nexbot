const DEFAULT_MODEL = 'gpt-4.1-mini';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getTextFromResponse(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = (data.output || [])
    .flatMap(item => item.content || [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text)
    .join('\n')
    .trim();

  return text || null;
}

function normalizeHistory(history = []) {
  return history
    .filter(item => item && typeof item.content === 'string' && item.content.trim())
    .slice(-10)
    .map(item => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim(),
    }));
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleChat(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, {
      error: 'Missing OPENAI_API_KEY. Add it to your environment before using the live chat endpoint.',
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const {
    message,
    history = [],
    botName = 'NexBot Assistant',
    systemPrompt = 'You are a helpful customer support assistant. Be concise and friendly.',
    model = DEFAULT_MODEL,
    maxTokens = 300,
    region = 'en',
    lang = 'en',
  } = body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    sendJson(res, 400, { error: 'Message is required' });
    return;
  }

  const input = [
    ...normalizeHistory(history).map(item => ({
      role: item.role,
      content: [{ type: 'input_text', text: item.content }],
    })),
    {
      role: 'user',
      content: [{ type: 'input_text', text: message.trim() }],
    },
  ];

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
        instructions: `${systemPrompt}\n\nBot name: ${botName}\nRegion: ${region}\nLanguage: ${lang}`,
        max_output_tokens: Number(maxTokens) || 300,
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      sendJson(res, upstream.status, {
        error: data?.error?.message || 'OpenAI request failed',
      });
      return;
    }

    const reply = getTextFromResponse(data);
    if (!reply) {
      sendJson(res, 502, { error: 'The model returned no text output.' });
      return;
    }

    sendJson(res, 200, {
      reply,
      model: data.model || model,
      id: data.id,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Unexpected server error',
    });
  }
}

function apiMiddleware(req, res, next) {
  if (req.url === '/api/chat') {
    handleChat(req, res);
    return;
  }

  if (req.url === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      provider: 'openai',
      configured: Boolean(process.env.OPENAI_API_KEY),
    });
    return;
  }

  next();
}

export function nexbotApiPlugin() {
  return {
    name: 'nexbot-api',
    configureServer(server) {
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(apiMiddleware);
    },
  };
}

