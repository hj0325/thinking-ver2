# Visual Thinking Machine

Visual Thinking Machine은 사용자 입력을 5W1H(Who/What/When/Where/Why/How) 노드로 구조화하고, AI 제안/채팅을 통해 다시 그래프로 확장하는 Next.js(Pages Router) 기반 웹앱입니다.

## Tech Stack
- Frontend: Next.js 16 (Pages Router), React 19, ReactFlow
- API layer: Next API Routes (`pages/api/*`)
- AI agent: `lib/thinkingAgent.js` (OpenAI SDK + Zod)
- Optional backend: FastAPI (`backend/*`)

## Current Runtime Path
- Primary: `pages/index.jsx` -> `components/ThinkingMachine.jsx` -> `pages/api/*` -> `lib/thinkingAgent.js`
- Optional: `backend/main.py` (FastAPI 병행 구현, 기본 프론트 경로는 아님)

## Project Structure (Pages Router)
```text
pages/
  _app.jsx
  index.jsx
  api/
    analyze.js
    chat.js
    chat-to-nodes.js

components/
  ThinkingMachine.jsx
  NodeMap.jsx
  InputPanel.jsx
  SuggestionPanel.jsx
  ChatDialog.jsx

lib/
  thinkingAgent.js

styles/
  globals.css

backend/                # optional FastAPI runtime
docs/specs/             # spec documents
```

## Prerequisites
- Node.js 20+
- npm or yarn
- `OPENAI_API_KEY` (required for analyze/chat APIs)

## Environment Variables
`.env.local`:

```bash
OPENAI_API_KEY=your_key_here
```

## Run (Next.js Primary Path)
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build / Start
```bash
npm run build
npm run start
```

## Lint
```bash
npm run lint
```

If `eslint: command not found` appears, run `npm install` first.

## API Endpoints
### `POST /api/analyze`
- Input: `{ text: string, history?: array }`
- Output: `{ nodes: array, edges: array }`

### `POST /api/chat`
- Input: suggestion metadata + `messages` + `user_message`
- Output: `{ reply: string }`

### `POST /api/chat-to-nodes`
- Input: suggestion metadata + `messages` + `existing_nodes`
- Output: `{ nodes: array, edges: array }`

## Optional FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Specs and Operations
- Overview: `docs/specs/01-overview.md`
- Requirements: `docs/specs/02-requirements.md`
- Architecture: `docs/specs/03-architecture.md`
- Test/Rollout: `docs/specs/04-test-rollout.md`
- Change Log: `docs/specs/05-change-log.md`
- Frontend Style: `docs/specs/06-frontend-style.md`
- Operations runbook: `docs/OPERATIONS.md`
