/**
 * NexBot Widget v2.0.0
 * Embeddable chatbot widget - Vanilla JavaScript, zero dependencies.
 *
 * Usage:
 *   <script src="nexbot.js"
 *     data-bot-id="YOUR_BOT_ID"
 *     data-bot-name="NexBot Assistant"
 *     data-greeting="Hi! How can I help you today?"
 *     data-region="fi"
 *     data-theme="#2563EB"
 *     data-position="bottom-right"
 *     data-lang="en"
 *     data-model="gpt-4.1-mini"
 *     data-max-tokens="300"
 *     data-system-prompt="You are a helpful support assistant."
 *     data-api-url="https://your-domain.com/api/chat">
 *   </script>
 */
(function (window, document) {
  'use strict';

  const script = document.currentScript || (function () {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  const defaultApiUrl = new URL('/api/chat', script.src || window.location.href).toString();

  const config = {
    botId: script.getAttribute('data-bot-id') || 'demo',
    botName: script.getAttribute('data-bot-name') || 'NexBot Assistant',
    greeting: script.getAttribute('data-greeting') || 'Hi! How can I help you today?',
    region: script.getAttribute('data-region') || 'en',
    theme: script.getAttribute('data-theme') || '#2563EB',
    position: script.getAttribute('data-position') || 'bottom-right',
    lang: script.getAttribute('data-lang') || 'en',
    model: script.getAttribute('data-model') || 'gpt-4.1-mini',
    systemPrompt: script.getAttribute('data-system-prompt') || 'You are a helpful customer support assistant. Be concise and friendly.',
    maxTokens: Number(script.getAttribute('data-max-tokens') || '300'),
    apiUrl: script.getAttribute('data-api-url') || defaultApiUrl,
  };

  const i18n = {
    en: { placeholder: 'Type a message...', error: 'Sorry, I could not reach the assistant right now.' },
    fi: { placeholder: 'Kirjoita viesti...', error: 'Valitettavasti assistenttia ei juuri nyt tavoiteta.' },
    sv: { placeholder: 'Skriv ett meddelande...', error: 'Tyvarr kunde assistenten inte nas just nu.' },
    no: { placeholder: 'Skriv en melding...', error: 'Beklager, assistenten er ikke tilgjengelig akkurat na.' },
  };

  const t = i18n[config.lang] || i18n.en;
  let authToken = null;
  let isOpen = false;
  let requestInFlight = false;
  const history = [];

  function generateSessionToken(botId, region) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'anonymous-' + Math.random().toString(36).slice(2),
      bot: botId,
      region: region,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    }));
    const sig = btoa('nexbot-sig-' + botId);
    return header + '.' + payload + '.' + sig;
  }

  function initAuth() {
    const key = 'nexbot_token_' + config.botId;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      authToken = stored;
    } else {
      authToken = generateSessionToken(config.botId, config.region);
      sessionStorage.setItem(key, authToken);
    }
  }

  function pushGTMEvent(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'nexbot_' + event, nexbot: data });
  }

  async function sendMessage(text) {
    pushGTMEvent('message_sent', { botId: config.botId, region: config.region });

    const payload = {
      botId: config.botId,
      botName: config.botName,
      message: text,
      history: history.slice(-8),
      region: config.region,
      lang: config.lang,
      model: config.model,
      systemPrompt: config.systemPrompt,
      maxTokens: config.maxTokens,
      sessionToken: authToken,
    };

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data.error || 'Chat request failed');
    }

    return data.reply;
  }

  const CSS = `
    #nexbot-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
    #nexbot-root { position: fixed; z-index: 9999; }
    #nexbot-root.bottom-right { bottom: 24px; right: 24px; }
    #nexbot-root.bottom-left  { bottom: 24px; left: 24px; }
    #nexbot-fab {
      width: 56px; height: 56px; border-radius: 50%; background: ${config.theme};
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,.25); transition: transform .2s, box-shadow .2s;
    }
    #nexbot-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,.32); }
    #nexbot-fab svg { width: 26px; height: 26px; fill: white; }
    #nexbot-window {
      position: absolute; bottom: 68px;
      width: 360px; height: 520px; border-radius: 16px;
      background: #fff; box-shadow: 0 16px 48px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transition: transform .25s cubic-bezier(.4,0,.2,1), opacity .2s;
      transform: scale(.85); opacity: 0; pointer-events: none;
    }
    #nexbot-root.bottom-right #nexbot-window { right: 0; transform-origin: bottom right; }
    #nexbot-root.bottom-left #nexbot-window { left: 0; transform-origin: bottom left; }
    #nexbot-window.open { transform: scale(1); opacity: 1; pointer-events: all; }
    #nexbot-header {
      background: ${config.theme}; padding: 16px 18px; display: flex; align-items: center; gap: 10px;
    }
    #nexbot-avatar { width: 36px; height: 36px; background: rgba(255,255,255,.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    #nexbot-avatar svg { width: 20px; height: 20px; fill: white; }
    #nexbot-header-info { flex: 1; }
    #nexbot-header-name { color: white; font-size: 15px; font-weight: 600; }
    #nexbot-header-status { color: rgba(255,255,255,.75); font-size: 12px; display: flex; align-items: center; gap: 4px; }
    .nexbot-dot { width: 7px; height: 7px; background: #4ade80; border-radius: 50%; }
    #nexbot-close { background: rgba(255,255,255,.2); border: none; border-radius: 8px; cursor: pointer; padding: 6px; display: flex; }
    #nexbot-close svg { width: 16px; height: 16px; stroke: white; fill: none; }
    #nexbot-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
    #nexbot-messages::-webkit-scrollbar { width: 4px; }
    #nexbot-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .nexbot-msg { display: flex; gap: 8px; max-width: 88%; }
    .nexbot-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .nexbot-bubble {
      padding: 10px 13px; border-radius: 14px; font-size: 14px; line-height: 1.45;
      max-width: 240px; word-break: break-word;
    }
    .nexbot-msg.bot .nexbot-bubble { background: white; color: #1e293b; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .nexbot-msg.user .nexbot-bubble { background: ${config.theme}; color: white; border-bottom-right-radius: 4px; }
    .nexbot-time { font-size: 11px; color: #94a3b8; align-self: flex-end; flex-shrink: 0; }
    .nexbot-typing { display: flex; gap: 4px; padding: 12px 14px; }
    .nexbot-typing span { width: 7px; height: 7px; background: #94a3b8; border-radius: 50%; animation: nexbot-bounce .9s infinite; }
    .nexbot-typing span:nth-child(2) { animation-delay: .15s; }
    .nexbot-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes nexbot-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    #nexbot-footer { padding: 12px; background: white; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; }
    #nexbot-input {
      flex: 1; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 13px;
      font-size: 14px; outline: none; transition: border-color .15s; color: #1e293b;
    }
    #nexbot-input:focus { border-color: ${config.theme}; }
    #nexbot-send {
      background: ${config.theme}; border: none; border-radius: 10px; width: 40px; height: 40px;
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity .15s; flex-shrink: 0;
    }
    #nexbot-send[disabled] { opacity: .5; cursor: progress; }
    #nexbot-send:hover:not([disabled]) { opacity: .85; }
    #nexbot-send svg { width: 18px; height: 18px; fill: white; }
    #nexbot-powered { text-align: center; padding: 6px; font-size: 10px; color: #94a3b8; background: white; }
    #nexbot-powered a { color: ${config.theme}; text-decoration: none; }
  `;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildUI() {
    const root = document.createElement('div');
    root.id = 'nexbot-root';
    root.className = config.position;

    root.innerHTML = [
      '<div id="nexbot-window">',
      '  <div id="nexbot-header">',
      '    <div id="nexbot-avatar">',
      '      <svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7 9a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1m10 0a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1M2 15a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1v-5H2m19 0h-1v5h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1M5 15v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6H5z"/></svg>',
      '    </div>',
      '    <div id="nexbot-header-info">',
      '      <div id="nexbot-header-name">' + escapeHtml(config.botName) + '</div>',
      '      <div id="nexbot-header-status"><span class="nexbot-dot"></span> Online | ' + escapeHtml(config.region.toUpperCase()) + '</div>',
      '    </div>',
      '    <button id="nexbot-close">',
      '      <svg viewBox="0 0 24 24" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '    </button>',
      '  </div>',
      '  <div id="nexbot-messages"></div>',
      '  <div id="nexbot-footer">',
      '    <input id="nexbot-input" type="text" placeholder="' + escapeHtml(t.placeholder) + '" autocomplete="off"/>',
      '    <button id="nexbot-send">',
      '      <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
      '    </button>',
      '  </div>',
      '  <div id="nexbot-powered">Powered by <a href="#" target="_blank" rel="noreferrer">NexBot</a></div>',
      '</div>',
      '<button id="nexbot-fab" aria-label="Open chat">',
      '  <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
      '</button>'
    ].join('\n');

    document.body.appendChild(root);
    return root;
  }

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function appendMessage(role, text) {
    const msgs = document.getElementById('nexbot-messages');
    const div = document.createElement('div');
    div.className = 'nexbot-msg ' + role;
    div.innerHTML = '<div class="nexbot-bubble">' + escapeHtml(text) + '</div><span class="nexbot-time">' + getTime() + '</span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    history.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
  }

  function showTyping() {
    const msgs = document.getElementById('nexbot-messages');
    const div = document.createElement('div');
    div.className = 'nexbot-msg bot';
    div.id = 'nexbot-typing-indicator';
    div.innerHTML = '<div class="nexbot-bubble nexbot-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('nexbot-typing-indicator');
    if (el) el.remove();
  }

  function setPending(isPending) {
    requestInFlight = isPending;
    const sendButton = document.getElementById('nexbot-send');
    const input = document.getElementById('nexbot-input');
    sendButton.disabled = isPending;
    input.disabled = isPending;
  }

  async function handleSend() {
    const input = document.getElementById('nexbot-input');
    const text = input.value.trim();
    if (!text || requestInFlight) return;

    input.value = '';
    appendMessage('user', text);
    showTyping();
    setPending(true);

    try {
      const reply = await sendMessage(text);
      hideTyping();
      appendMessage('bot', reply);
      pushGTMEvent('message_received', { botId: config.botId, region: config.region });
    } catch (error) {
      hideTyping();
      appendMessage('bot', error && error.message ? error.message : t.error);
      pushGTMEvent('message_error', { botId: config.botId, region: config.region });
    } finally {
      setPending(false);
      input.focus();
    }
  }

  function toggleWindow() {
    isOpen = !isOpen;
    const win = document.getElementById('nexbot-window');
    win.classList.toggle('open', isOpen);
    pushGTMEvent(isOpen ? 'opened' : 'closed', { botId: config.botId, region: config.region });
  }

  function bindEvents() {
    document.getElementById('nexbot-fab').addEventListener('click', toggleWindow);
    document.getElementById('nexbot-close').addEventListener('click', toggleWindow);
    document.getElementById('nexbot-send').addEventListener('click', handleSend);
    document.getElementById('nexbot-input').addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function boot() {
    initAuth();
    injectStyles();
    buildUI();
    bindEvents();
    setTimeout(function () {
      appendMessage('bot', config.greeting);
    }, 300);
    pushGTMEvent('widget_loaded', { botId: config.botId, region: config.region, model: config.model });
    console.log('[NexBot] Widget loaded.', { botId: config.botId, region: config.region, apiUrl: config.apiUrl });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window, document);
