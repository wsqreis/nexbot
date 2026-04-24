<div align="center">

<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white"/>
<img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
<img src="https://img.shields.io/badge/GTM-Integrated-246FDB?style=for-the-badge&logo=googletagmanager&logoColor=white"/>

# 🤖 NexBot — Embeddable Chatbot Platform

**A practical embeddable chatbot platform with a zero-dependency widget, a React admin dashboard, and a local chat API wired to OpenAI Responses.**

[Features](#-features) · [Getting Started](#-getting-started) · [Widget Embed](#-widget-embed) · [Architecture](#-architecture)

</div>

---

## ✨ Features

### 🧩 Zero-dependency Embeddable Widget
- Standalone ES6 widget served from [public/widget/nexbot.js](public/widget/nexbot.js).
- Configurable entirely via HTML `data-*` attributes (theme, region, language, model, API URL).
- Anonymous session token stored in `sessionStorage` per bot (`nexbot_token_{botId}`).
- Pushes analytics events to `window.dataLayer` for GTM integration.

### ⚛️ React Dashboard (Admin)
- Built with React and a small set of dashboard panels to manage the widget and preview behavior.
- Key panels: `Chatbot Config`, `Live Preview`, `GTM & Tracking`, `Regions`, `Deploy` (simulated).
- Uses a client-side, demo-friendly JWT flow implemented in [src/auth/AuthContext.jsx](src/auth/AuthContext.jsx).

### 🚀 Local Chat API
- Vite dev/preview middleware exposes `/api/chat` handled by [vite.api.js](vite.api.js).
- Server forwards requests to the OpenAI Responses API when `OPENAI_API_KEY` is present.
- If `OPENAI_API_KEY` is missing, the endpoint returns an explanatory 503 error to avoid leaking keys client-side.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+

### Install & Run

```bash
git clone https://github.com/wsqreis/nexbot.git
cd nexbot
npm install
cp .env.example .env
```

Set your OpenAI API key in `.env`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:5173`.

### Demo credentials

Email:    demo@nexbot.io
Password: demo1234

Or click "Use demo credentials" on the login screen.

---

## 🌐 Widget Embed

Drop this snippet into any page (the project serves the widget at `/widget/nexbot.js` during dev):

```html
<script src="/widget/nexbot.js"
  data-bot-id="my-bot"
  data-bot-name="NexBot Assistant"
  data-greeting="Hi! How can I help you today?"
  data-region="fi"
  data-theme="#6366f1"
  data-position="bottom-right"
  data-lang="en"
  data-model="gpt-4.1-mini"
  data-max-tokens="300"
  data-system-prompt="You are a helpful support assistant for a Nordic energy company."
  data-api-url="https://your-domain.com/api/chat">
</script>
```

### Supported attributes

| Attribute | Default | Purpose |
|---|---:|---|
| `data-bot-id` | `demo` | Unique bot identifier used for session tokens and analytics |
| `data-bot-name` | `NexBot Assistant` | Header text in the widget |
| `data-greeting` | `Hi! How can I help you today?` | Initial assistant message |
| `data-region` | `en` | Region shorthand (`fi`,`sv`,`no`,`en`) |
| `data-theme` | `#2563EB` | Primary color used by the widget |
| `data-position` | `bottom-right` | `bottom-right` or `bottom-left` |
| `data-lang` | `en` | UI language (affects placeholders & errors) |
| `data-model` | `gpt-4.1-mini` | Model string forwarded to the server/OpenAI |
| `data-max-tokens` | `300` | Max output tokens sent to the API |
| `data-system-prompt` | project default | System instructions sent to the model |
| `data-api-url` | `/api/chat` | Endpoint the widget will POST chat requests to |

---

## 🔐 Authentication & Sessions

- Dashboard auth is demo-oriented and implemented in [src/auth/AuthContext.jsx](src/auth/AuthContext.jsx). It simulates JWT creation and stores the token in `localStorage` for the admin UI.
- The widget uses an anonymous session token persisted to `sessionStorage` (key: `nexbot_token_{botId}`) so end users do not need to log in.

---

## 📊 GTM Integration

The widget pushes these events to `window.dataLayer` (see [public/widget/nexbot.js](public/widget/nexbot.js)):

```js
{ event: 'nexbot_widget_loaded', nexbot: { botId, region, model } }
{ event: 'nexbot_opened', nexbot: { botId, region } }
{ event: 'nexbot_closed', nexbot: { botId, region } }
{ event: 'nexbot_message_sent', nexbot: { botId, region } }
{ event: 'nexbot_message_received', nexbot: { botId, region } }
{ event: 'nexbot_message_error', nexbot: { botId, region } }
```

- The dashboard's GTM panel ([src/dashboard/GTMPanel.jsx](src/dashboard/GTMPanel.jsx)) is a simulator that helps test event pushes and preview tag firing locally.

---

## 🌍 Supported Regions

This project includes localized UI strings and region support for Nordic markets plus English. See the widget's i18n map in [public/widget/nexbot.js](public/widget/nexbot.js).

Currently supported locales: `en`, `fi`, `sv`, `no`.

---

## 🏗️ Architecture

```
nexbot/
├── public/
│   └── widget/
│       └── nexbot.js          # ← Standalone ES6 widget (zero deps)
├── src/
│   ├── auth/
│   │   ├── AuthContext.jsx    # Demo JWT provider and helpers
│   │   └── LoginPage.jsx      # Login/Register UI
│   ├── dashboard/
│   │   ├── ChatbotConfig.jsx  # Widget settings & embed snippet generator
│   │   ├── LivePreview.jsx    # Renders the real widget inside an iframe
│   │   └── GTMPanel.jsx       # Tag simulator + event log
│   ├── App.jsx
│   └── main.jsx
├── vite.api.js                # Vite middleware for /api/chat -> OpenAI Responses
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Widget | Vanilla JavaScript (ES6+) |
| Build | Vite 8 |
| Auth | Client-side demo JWT (localStorage) |
| AI API | OpenAI Responses API (server-side key) |
| Tracking | Google Tag Manager (`dataLayer`) |

---

## 🧪 Testing the Widget Locally

1. Run `npm run dev`
2. Log in to the dashboard with demo credentials
3. Save a bot configuration in `Chatbot Config`
4. Open `Live Preview` to see the real widget in an iframe
5. Send a message — if `OPENAI_API_KEY` is set, the Vite middleware will call OpenAI
6. Inspect `window.dataLayer` in DevTools to see GTM events

---

## 📄 License

MIT — free to use, modify, and distribute.

---

Made with ☕ by Wesley Reis — https://github.com/wsqreis
