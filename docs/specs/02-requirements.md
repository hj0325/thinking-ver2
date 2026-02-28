# 02. Requirements

## Follow-up To-do

## 1. Document Meta
- Version: `v1.0-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`

## 2. Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| FR-001 | 사용자가 텍스트를 제출하면 서버 분석 API를 호출한다. | P0 | `text`가 비어있지 않으면 `/api/analyze` POST 호출 |
| FR-002 | 분석 결과로 사용자 노드(1~4개)와 엣지를 그래프에 추가한다. | P0 | 응답 `nodes`, `edges`를 ReactFlow 형식으로 반영 |
| FR-003 | AI 제안 노드를 별도 Suggestion 카드로 분리해 우측 패널에 표시한다. | P0 | `is_ai_generated=true` 노드는 그래프에 직접 추가하지 않고 카드화 |
| FR-004 | 제안과 연결된 메인 노드를 강조 표시한다. | P1 | `e-suggest-*`의 source 노드가 `node-highlighted` 클래스로 강조 |
| FR-005 | 제안 카드를 클릭하면 채팅 다이얼로그를 열고, 카드별 대화 상태를 관리한다. | P0 | 같은 카드 재클릭 시 토글, dismiss 시 열린 채팅 닫힘 |
| FR-006 | 채팅 다이얼로그 오픈 시 AI가 첫 설명 메시지를 자동 생성한다. | P1 | 카드 오픈 후 최초 호출에서 assistant 메시지 생성 |
| FR-007 | 사용자가 채팅 내용을 노드로 변환할 수 있다. | P0 | `/api/chat-to-nodes` 호출 후 반환 노드/엣지가 그래프에 병합 |
| FR-008 | API 실패 시 사용자에게 오류 메시지를 제공한다. | P0 | analyze/chat/chat-to-nodes 실패 시 alert 또는 대화 내 오류 메시지 노출 |
| FR-009 | API는 POST 메서드만 허용한다. | P0 | 비-POST 요청은 `405 Method Not Allowed` 반환 |
| FR-010 | OpenAI API 키 누락 시 서버가 명확한 오류를 반환한다. | P0 | `500` + `OpenAI API Key is missing on server.` |

## 3. API Input/Output Requirements

### 3.1 Analyze API
- Endpoint: `POST /api/analyze`
- Required input:
  - `text: string (non-empty)`
  - `history: array` (optional, default `[]`)
- Output:
  - `nodes: array`
  - `edges: array`

### 3.2 Chat API
- Endpoint: `POST /api/chat`
- Required input:
  - `suggestion_title`, `suggestion_content`, `suggestion_category`, `suggestion_phase`
  - `messages: array`
  - `user_message: string`
- Output:
  - `reply: string`

### 3.3 Chat-to-Nodes API
- Endpoint: `POST /api/chat-to-nodes`
- Required input:
  - suggestion metadata
  - `messages: array`
  - `existing_nodes: array`
- Output:
  - `nodes: array`
  - `edges: array`

## 4. Data and Domain Rules
1. 카테고리 enum은 `Who/What/When/Where/Why/How`로 제한한다.
2. Phase enum은 `Problem/Solution`으로 제한한다.
3. 엣지 ID prefix 규칙:
   - `e-input-*`: 입력으로 생성된 사용자 노드 간 연결
   - `e-suggest-*`: 사용자 노드 -> 제안 노드 연결
   - `e-chat-*`: 채팅 변환 노드 간 연결
   - `e-cross-*`: 기존 노드와 교차 연결
4. 기존 노드가 있을 때 cross-connection이 비어 있으면 fallback 연결을 생성한다.

## 5. Non-Functional Requirements

| Category | Requirement | Initial Target |
|---|---|---|
| Performance | Analyze API 응답 시간 | p95 < 5s (모델 응답 포함) |
| Performance | Chat API 응답 시간 | p95 < 4s |
| Reliability | 서버 에러율 | 1% 미만 |
| Robustness | 모델 응답 파싱 실패 대응 | 스키마 보정 시도 후 실패 시 명확한 에러 반환 |
| Security | 비밀정보 보호 | API key는 서버 env에서만 사용 |
| Observability | 장애 추적 가능성 | 서버 에러 로그와 API 경로별 실패 확인 가능 |

## 6. Constraints
- 외부 모델 응답 품질/지연에 의존한다.
- 현재는 영속 저장소가 없고 세션 메모리 상태 중심이다.
- 프론트는 Next API 경로를 직접 사용하므로 API 계약 변경 시 UI 동시 수정이 필요하다.

## 7. Open Questions
| ID | Question | Owner | Due Date | Status |
|---|---|---|---|---|
| RQ-001 | Python backend를 운영 경로로 유지할지 | TBD | TBD | Open |
| RQ-002 | NFR 목표치를 운영 현실에 맞게 상향/하향할지 | TBD | TBD | Open |
| RQ-003 | 사용자 오류 메시지 문구를 한국어로 통일할지 | TBD | TBD | Open |
