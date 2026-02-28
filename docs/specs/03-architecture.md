# 03. Architecture

## Follow-up To-do
- [ ] [added: 2026-02-28] JS agent와 Python agent 단일화 여부 결정
- [ ] [added: 2026-02-28] API 오류 로깅 포맷 표준화
- [ ] [added: 2026-02-28] 노드/엣지 ID 규칙 문서와 코드 동기화 자동 체크 도입
- [ ] [added: 2026-02-28] 모델 버전 업데이트 정책 수립

## 1. Document Meta
- Version: `v1.0-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`

## 2. High-Level Architecture

```mermaid
flowchart LR
  U[User] --> UI[Next.js UI<br/>pages/index.jsx + components]
  UI --> API[Next API Routes<br/>/api/analyze /api/chat /api/chat-to-nodes]
  API --> AGENT[lib/thinkingAgent.js]
  AGENT --> OAI[OpenAI API]
  OAI --> AGENT
  AGENT --> API
  API --> UI
```

## 3. Runtime Boundary
- Primary runtime path(현재 사용자 경로): Next.js + `pages/api/*` + `lib/thinkingAgent.js`
- Secondary/optional path: FastAPI `backend/*` (동일 도메인 로직을 Python으로 별도 보유)

## 4. Frontend Component Architecture

| Component | Role | Key State/Action |
|---|---|---|
| `pages/index.jsx` | 앱 엔트리 | `ThinkingMachine` 렌더링 |
| `components/ThinkingMachine.jsx` | 오케스트레이션 | nodes, edges, suggestions, activeSuggestion, highlightedNodeIds |
| `components/NodeMap.jsx` | 그래프 렌더링 | ReactFlow 노드/엣지 표시, 강조 class 반영 |
| `components/SuggestionPanel.jsx` | 제안 카드 목록 UI | 카드 선택/닫기 |
| `components/ChatDialog.jsx` | 제안별 대화/변환 | `/api/chat`, `/api/chat-to-nodes` 호출 |
| `components/InputPanel.jsx` | 입력 폼 | Enter 제출, 로딩 상태 반영 |

## 5. API Layer Architecture

| Endpoint | Method | Handler Responsibility |
|---|---|---|
| `/api/analyze` | POST | 입력 검증, `agent.processIdea` 호출, 스키마 에러 가공 |
| `/api/chat` | POST | `agent.chatWithSuggestion` 호출 |
| `/api/chat-to-nodes` | POST | `agent.chatToNodes` 호출, 스키마 에러 가공 |

공통 동작:
1. API 키 확인 (`OPENAI_API_KEY`)
2. singleton agent 캐시 사용 (`cachedAgent`)
3. 비-POST 요청 `405` 반환

## 6. AI Agent Internal Design (`lib/thinkingAgent.js`)

### 6.1 Core Responsibilities
- 모델 입력 프롬프트 조합
- JSON 강제 출력 (`response_format: json_object`)
- 응답 정규화 (`normalize*`) 및 Zod 검증
- 스키마 불일치 시 보정 호출(`repairToSchema`) 수행
- UI가 바로 사용 가능한 노드/엣지 구조 생성

### 6.2 Data Construction Rules
- 노드 위치 계산: phase와 category 기반 기본 좌표 + 슬롯 오프셋
- 생성 노드 수: 1~4
- 제안 노드: 별도 1개 생성(`is_ai_generated=true`)
- 엣지 생성:
  - input 노드 연속 연결
  - main 노드 -> suggestion 연결
  - 기존 노드 cross-connection
  - cross-connection 미생성 시 fallback 연결

### 6.3 Chat-to-Nodes Rules
- 채팅 메시지 정규화 후 요약 노드 생성
- 생성 노드 간 `e-chat-*` 엣지 연결
- 기존 노드와 cross 연결, 없으면 마지막 기존 노드 fallback 연결

## 7. Error Handling Architecture
- API layer:
  - 입력 오류: `400`
  - 메서드 오류: `405`
  - 내부/외부 오류: `500`
- Agent layer:
  - JSON 파싱 실패 예외 처리
  - Zod 검증 실패 시 재보정 시도
- UI layer:
  - analyze/chat-to-nodes 실패: alert
  - chat 실패: 대화창 내 assistant 오류 메시지 삽입

## 8. Technical Debt and Architecture Decisions Pending
1. `onConnect` 콜백 정의는 있으나 NodeMap에서 연결 핸들러 전달/사용이 없다.
2. FastAPI 구현과 JS 구현이 기능적으로 중복되어 동기화 비용이 크다.
3. README가 현재 `pages` 기반 구조를 반영하지 못한다.

## 9. Future Architecture Direction (Recommended)
1. 운영 경로를 Next API로 단일화하거나, 반대로 Python을 표준으로 정하고 프런트 경로를 분리해 중복 제거.
2. API contract를 OpenAPI/JSON Schema로 추출해 프론트/백엔드 동기화 자동화.
3. 관측성(요청 ID, 실패 원인 코드)을 명시적으로 추가해 장애 분석 속도 개선.
