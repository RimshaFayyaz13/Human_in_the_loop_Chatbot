# 🤖 HITL Chatbot — Human-in-the-Loop AI Assistant

A production-grade, full-stack AI chatbot with **Human-in-the-Loop (HITL)** approval flows powered by **LangGraph**, **FastAPI**, and **Next.js 14**. Before executing any sensitive action (like crawling GitHub repos or LinkedIn profiles), the agent pauses and requests explicit user approval.

---

## ✨ Features

- 🧠 **LangGraph-powered agent** with interrupt-based HITL approval flow
- 🔐 **Approval gate** — sensitive tool calls require user confirmation before execution
- 🐙 **GitHub repo crawling** — extract structured data from any public repository
- 💼 **LinkedIn profile crawling** — fetch profile data with user consent
- 💬 **Persistent conversation threads** — memory checkpointing per `thread_id`
- 🎨 **Premium glassmorphism UI** — dark, modern, minimal design with Framer Motion animations
- ⚡ **FastAPI async backend** — fully async with lifespan-managed checkpointer

---

## 🖼️ UI Overview

| State | Description |
|---|---|
| **Welcome / Empty** | Hero screen with capability pills and suggested prompts |
| **Chat** | Animated message bubbles with glass-effect assistant replies |
| **Awaiting Approval** | Amber approval card showing tool name, args, and description |
| **Loading** | Staggered bouncing dot indicator |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations & transitions |
| Lucide React `v0.294.0` | Icons |
| Inter (Google Font) | Typography |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Async REST API |
| LangGraph | Agent orchestration with HITL interrupts |
| LangChain | LLM integration & tool calling |
| Pydantic v2 | Request/response validation |
| AsyncPostgres / SQLite | Conversation checkpointing |

---

## 📁 Project Structure

```
hitl-chatbot/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app + CORS + lifespan
│       ├── config.py            # Settings (env vars)
│       ├── api/
│       │   └── routes.py        # /chat, /approval, /history endpoints
│       ├── schemas/
│       │   └── chat.py          # Pydantic models
│       ├── services/
│       │   └── chat_service.py  # Agent driving logic
│       ├── core/
│       │   └── nodes.py
│       │   └── state.py
│       │   └── graph.py         # LangGraph definition
│       ├── memory/
│       │   └── checkpointer.py  # Async checkpointer init/close
│       ├── tools/               # Registered agent tools (GitHub, LinkedIn)
│       │   └── github_tool.py
│       │   └── linkedin_tool.py
│
└── frontend/
    ├── app/
    │   ├── globals.d.ts
    │   ├── layout.tsx           # Root layout (Inter font, dark bg)
    │   ├── page.tsx             # Entry point → renders ChatBox
    │   └── globals.css          # Tailwind directives + scrollbar styles
    ├── components/
    │   └── ChatBox.tsx         # Full chat UI (sidebar, messages, input, approval)
    │   ├──ApprovalCard.tsx
    │   └──MessageBubble.tsx
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── next.config.js
    ├── package.json
    └── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>= 18`
- Python `>= 3.11`
- A Groq API key

---

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/hitl-chatbot.git
cd hitl-chatbot
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
GROQ_API_KEY=sk-...
CORS_ORIGINS=http://localhost:3000
# Optional
GITHUB_TOKEN=ghp_...
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔁 HITL Approval Flow

```
User sends message
       │
       ▼
 POST /api/chat
       │
       ▼
 LangGraph agent runs
       │
   Sensitive tool?
      /    \
    YES      NO
     │        │
     ▼        ▼
interrupt   reply sent
     │      to user
     ▼
Frontend shows
Approval Card
     │
  User clicks
  ✅ or ❌
     │
     ▼
POST /api/approval
{ decision: "approve" | "reject" }
     │
     ▼
Agent resumes →
reply sent to user
```

---

## 📡 API Reference

### `POST /api/chat`
Send a user message.

```json
{
  "thread_id": "thread-abc123",
  "message": "Crawl github repo openai/openai-python"
}
```

**Response (normal):**
```json
{
  "thread_id": "thread-abc123",
  "status": "message",
  "reply": "Here is what I found..."
}
```

**Response (approval needed):**
```json
{
  "thread_id": "thread-abc123",
  "status": "awaiting_approval",
  "pending": {
    "tool_name": "github_repo_crawl",
    "tool_args": { "owner": "openai", "repo": "openai-python" },
    "description": "Crawl GitHub repo openai/openai-python"
  }
}
```

---

### `POST /api/approval`
Approve or reject a pending tool call.

```json
{
  "thread_id": "thread-abc123",
  "decision": "approve",
  "feedback": null
}
```

> ⚠️ `decision` must be exactly `"approve"` or `"reject"` (not `"approved"`/`"rejected"`)

---

### `GET /api/history/{thread_id}`
Fetch full conversation history for a thread.

---

## ⚙️ tsconfig.json notes

- `baseUrl` was removed (deprecated in TS 7.0)
- Path alias `@/*` maps to `./*` for clean imports
- `include` uses `**/*.ts` and `**/*.tsx` globs

---

## 🎨 Frontend Configuration Notes

- Tailwind requires `.next` cache clear after config changes:
  ```powershell
  Remove-Item -Recurse -Force .next
  npm run dev
  ```
- CSS `@tailwind` directives show a yellow underline in VS Code — this is harmless. Fix by installing the **Tailwind CSS IntelliSense** extension or adding `"css.lint.unknownAtRules": "ignore"` to `.vscode/settings.json`
- Lucide React pinned to `v0.294.0` for `Github` and `Linkedin` icon support

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a PR

---

## 📄 License

MIT © 2026
