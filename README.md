<div align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/OpenAI-GPT--4.1-412991?style=for-the-badge&logo=openai&logoColor=white"/>
<img src="https://img.shields.io/badge/Supabase-Integrated-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-HMAC--SHA256-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white"/>

# 🤖 NexBot — Embeddable Chatbot Platform

**A production-grade chatbot management platform built with React 19 + Vanilla JavaScript.**  
Inspired by real-world chatbot products like Boost AI — featuring a zero-dependency embeddable widget,
server-side JWT authentication, a real OpenAI backend, Supabase usage tracking,
Google Tag Manager integration, and multi-region Nordic market support.

> **Note:** Some dashboard panels (Deploy, Regions stats, GTM tag management) are UI demonstrations / proof-of-concept with simulated data. Core features — widget embedding, JWT auth, OpenAI chat API, and GTM `dataLayer` events — are fully functional.

### 🚀 [Live Demo → nexbot-steel.vercel.app](https://nexbot-steel.vercel.app/)

[Features](#-features) · [Getting Started](#-getting-started) · [Widget Embed](#-widget-embed) · [API Reference](#-api-reference) · [Architecture](#-architecture)

</div>

---

## ✨ Features

### 🧩 Vanilla JS Embeddable Widget (v2.0.0)
A standalone chatbot widget with **zero dependencies** embeddable on any website with a single `<script>` tag.

- **Real AI responses** — connects to the backend `/api/chat` endpoint, which calls OpenAI `/v1/responses`
- **JWT session authentication** — per-session anonymous tokens via `sessionStorage`
- **GTM integration** — automatically pushes events to `window.dataLayer`
- **Multi-region & multi-language** — Finnish 🇫🇮, Swedish 🇸🇪, Norwegian 🇳🇴, English 🌐
- **Fully configurable** via `data-*` attributes — model, system prompt, theme, greeting, and more

### ⚛️ React 19 Dashboard
A complete management interface with persistent config, live preview, and real deploy flows.

| Panel | Description |
|-------|-------------|
| **Chatbot Config** | Customize bot name, greeting, model, system prompt, theme — auto-generates embed snippet |
| **GTM & Tracking** | Custom tags/triggers UI + real `window.dataLayer` event push — tag persistence is a UI demo, not a live GTM container |
| **Regions** | Nordic region management UI with per-region activation controls — user/session stats are simulated |
| **Deploy** | Staging → Production deployment flow UI — simulated CI/CD steps and deployment history (proof of concept) |
| **Live Preview** | Real-time widget preview rendered in an iframe with live config controls |

### 🔐 Server-Side Authentication
- **Real JWT** signed with `HMAC-SHA256` via Node.js `crypto` module
- Passwords hashed with `SHA-256` before storage
- Users persisted to `data/users.json`
- Built-in demo user fallback (`demo@nexbot.io` / `demo1234`)
- `ALLOW_REGISTRATION=false` flag to lock registration in production

### 📊 Supabase Usage Tracking *(optional)*
When `SUPABASE_URL` and `SUPABASE_KEY` are set, every chat request is logged to the `nexbot_usage` table — enabling rate limiting, analytics, and abuse prevention without requiring any changes to the widget.

---

## 🚀 Getting Started

### 🌐 Live Demo

Try it now — no installation required:

**[https://nexbot-steel.vercel.app/](https://nexbot-steel.vercel.app/)**

```
Email:    demo@nexbot.io
Password: demo1234
```

### Local Development

#### Prerequisites
- Node.js 18+
- npm
- An OpenAI API key (required for live AI responses)

#### Installation

```bash
git clone https://github.com/wsqreis/nexbot.git
cd nexbot
npm install
```

#### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
# Required — powers the /api/chat endpoint
OPENAI_API_KEY=sk-...

# Optional — enables usage tracking and rate limiting
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# Optional — customise auth behaviour
AUTH_SECRET=your-secret-key        # default: nexbot_dev_secret
DEMO_EMAIL=demo@nexbot.io          # default demo login
DEMO_PASSWORD=demo1234             # default demo password
ALLOW_REGISTRATION=true            # set false to lock in prod
TOKEN_EXP_SECONDS=3600             # JWT expiry (default: 1h)
```

#### Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🌐 Widget Embed

Drop this snippet anywhere in your HTML:

```html
<script src="https://your-domain.com/widget/nexbot.js"
  data-bot-id="my-bot"
  data-bot-name="Support Assistant"
  data-greeting="Hi! How can I help you today?"
  data-region="fi"
  data-theme="#6366f1"
  data-position="bottom-right"
  data-lang="fi"
  data-model="gpt-4.1-mini"
  data-max-tokens="300"
  data-system-prompt="You are a helpful support agent. Be concise and friendly."
  data-api-url="https://your-domain.com/api/chat">
</script>
```

### All `data-*` Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-bot-id` | `demo` | Unique identifier for this bot instance |
| `data-bot-name` | `NexBot Assistant` | Display name shown in the widget header |
| `data-greeting` | `Hi! How can I help?` | First message shown when chat opens |
| `data-region` | `en` | Region code: `fi`, `sv`, `no`, `en` |
| `data-theme` | `#2563EB` | Widget accent color (hex) |
| `data-position` | `bottom-right` | `bottom-right` or `bottom-left` |
| `data-lang` | `en` | UI language: `en`, `fi`, `sv`, `no` |
| `data-model` | `gpt-4.1-mini` | OpenAI model to use |
| `data-max-tokens` | `300` | Max tokens per response |
| `data-system-prompt` | *(see defaults)* | Custom instructions for the AI |
| `data-api-url` | `/api/chat` (relative) | Chat API endpoint URL |

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│                  Dashboard Login                     │
└────────────────────┬────────────────────────────────┘
                     │  POST /api/auth/login
                     ▼
          ┌──────────────────────┐
          │  api/auth/login.js   │
          │  - Read users.json   │
          │  - SHA-256 password  │
          │  - Sign HMAC-SHA256  │
          │    JWT token         │
          └──────────┬───────────┘
                     │  { token, user }
                     ▼
          ┌──────────────────────┐
          │  AuthContext.jsx     │
          │  - Store in          │
          │    localStorage      │
          │  - Decode on load    │
          │  - Check exp claim   │
          └──────────┬───────────┘
                     │
                     ▼
          ProtectedRoute → /dashboard
```

The **widget** generates a separate anonymous session token stored in `sessionStorage` — end users never log in.

---

## 📡 API Reference

All routes are served by the Vite dev server plugin (`vite.api.js`) in development. In production, deploy these as your server's API handlers.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ✗ | Login with email + password → JWT |
| `POST` | `/api/auth/register` | ✗ | Register new user → JWT |
| `GET` | `/api/auth/me` | ✓ | Verify token, return user info |
| `POST` | `/api/chat` | ✗ | Send message → OpenAI → AI reply |
| `GET` | `/api/health` | ✗ | Health check + config status |

### `POST /api/chat` — Request Body

```json
{
  "message": "Hello!",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" }
  ],
  "botName": "NexBot Assistant",
  "systemPrompt": "You are a helpful assistant.",
  "model": "gpt-4.1-mini",
  "maxTokens": 300,
  "region": "fi",
  "lang": "en"
}
```

### Response

```json
{
  "reply": "Hi! How can I help you today?",
  "model": "gpt-4.1-mini",
  "id": "resp_abc123"
}
```

---

## 📊 GTM Integration

The widget automatically pushes to `window.dataLayer` on every interaction:

```javascript
{ event: 'nexbot_widget_loaded',    nexbot: { botId, region } }
{ event: 'nexbot_opened',           nexbot: { botId, region } }
{ event: 'nexbot_message_sent',     nexbot: { botId, region } }
{ event: 'nexbot_message_received', nexbot: { botId } }
{ event: 'nexbot_closed',           nexbot: { botId, region } }
```

Use the **GTM Panel** in the dashboard to create custom tags, map triggers, and fire test events to validate your setup.

---

## 🗄️ Supabase Usage Tracking *(optional)*

Run the migration to create the tracking table:

```bash
npm run db:migrate
```

Or paste `db/migrations/001_create_nexbot_usage.sql` into your Supabase SQL editor.

Once configured, every `/api/chat` request logs:

```sql
id          uuid        -- auto-generated
identifier  text        -- hashed IP or session ID
bot_id      text        -- from data-bot-id
region      text        -- from data-region
model       text        -- model used
meta        jsonb       -- extra context
created_at  timestamptz -- timestamp
```

---

## 🌍 Supported Regions

| Region | Language | Status | Notes |
|--------|----------|--------|-------|
| 🇫🇮 Finland | Finnish | ✅ Active | Primary market |
| 🇸🇪 Sweden | Swedish | ✅ Active | |
| 🇳🇴 Norway | Norwegian | ✅ Active | |
| 🇩🇰 Denmark | Danish | 🔜 Pending | Expansion in progress |
| 🌐 International | English | ✅ Active | Fallback |

---

## 🏗️ Architecture

```
nexbot/
├── api/                              # Server-side API handlers
│   ├── auth/
│   │   ├── login.js                 # POST /api/auth/login
│   │   ├── register.js              # POST /api/auth/register
│   │   └── me.js                    # GET  /api/auth/me
│   ├── authUtils.js                 # JWT sign/verify (HMAC-SHA256), SHA-256 hash
│   ├── chat.js                      # POST /api/chat → OpenAI /v1/responses
│   └── supabase.js                  # Supabase client (optional)
├── db/
│   └── migrations/
│       └── 001_create_nexbot_usage.sql
├── public/
│   └── widget/
│       └── nexbot.js                # ← Vanilla JS widget v2.0 (zero deps)
├── scripts/
│   └── run-migration.js
├── src/
│   ├── auth/
│   │   ├── AuthContext.jsx          # Auth state + real API calls
│   │   └── LoginPage.jsx            # Login / Register UI
│   ├── dashboard/
│   │   ├── Dashboard.jsx            # App shell + sidebar
│   │   ├── ChatbotConfig.jsx        # Bot config panel
│   │   ├── chatbotConfigStore.js    # Config persistence (localStorage)
│   │   ├── GTMPanel.jsx             # Tags, triggers, event log
│   │   ├── RegionsPanel.jsx         # Nordic region management
│   │   ├── DeployPanel.jsx          # Staging → Production pipeline
│   │   ├── LivePreview.jsx          # Real-time iframe widget preview
│   │   └── ui.jsx                   # Shared components (Card, Field, PageHeader)
│   ├── App.jsx                      # Router + protected route guard
│   ├── main.jsx
│   └── index.css
├── vite.config.js                   # Vite + API plugin
├── vite.api.js                      # Dev server API middleware
├── .env.example
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Routing | React Router | v7 |
| Build | Vite | 8.x |
| Widget | Vanilla JavaScript | ES6+ (zero deps) |
| Auth | JWT / HMAC-SHA256 | Node.js `crypto` |
| AI | OpenAI Responses API | `gpt-4.1-mini` |
| Database | Supabase (PostgreSQL) | optional |
| Tracking | Google Tag Manager | dataLayer |

---

## 🧪 Local Testing

### Test the AI chat
1. Add `OPENAI_API_KEY` to `.env`
2. Run `npm run dev`
3. Go to **Live Preview** — the widget makes real calls to `/api/chat`

### Test GTM events
1. Open DevTools → Console
2. Interact with the widget
3. Run `window.dataLayer` to see events in real-time

### Test the API directly
```bash
# Health check
curl http://localhost:5173/api/health

# Login
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@nexbot.io","password":"demo1234"}'

# Send a chat message
curl -X POST http://localhost:5173/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","model":"gpt-4.1-mini"}'
```

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">

Made with ☕ by [Wesley Reis](https://github.com/wsqreis) · [LinkedIn](https://linkedin.com/in/wesley-de-queiroz)  
⭐ Star this repo if it helped you!

</div>