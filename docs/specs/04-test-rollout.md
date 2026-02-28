# 04. Test and Rollout

## Follow-up To-do
- [ ] [added: 2026-02-28] [P0] 영어 전용 회귀 테스트를 추가한다 (UI 스냅샷/DOM 텍스트에 한글 미포함 검증).
- [ ] [added: 2026-02-28] [P0] `/api/chat` 및 `/api/chat-to-nodes` 응답 텍스트 언어 검증 테스트를 추가한다.
- [ ] [added: 2026-02-28] [P1] 배포 전 스모크 테스트에 \"입력->분석->제안->채팅->변환\" 영어 출력 체크를 포함한다.
- [ ] [added: 2026-02-28] [P1] 모델 응답 스키마 보정 경로에서 영어 fallback 유지 여부를 검증한다.
- [ ] [added: 2026-02-28] [P2] Python backend 테스트를 유지할 경우 동일한 영어 정책 검증 케이스를 추가한다.

## 1. Document Meta
- Version: `v1.0-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`

## 2. Quality Objectives
1. 핵심 사용자 플로우(입력 분석 -> 제안 -> 채팅 -> 노드 변환)가 릴리즈마다 회귀 없이 동작해야 한다.
2. 모델 출력 변동(형식 불일치) 상황에서도 시스템이 명시적 실패 또는 보정 동작을 수행해야 한다.
3. 장애 시 롤백 기준과 절차가 문서화되어 즉시 실행 가능해야 한다.

## 3. Test Strategy

### 3.1 Unit Tests
- Agent 유틸 함수:
  - `normalizeCategory`, `normalizePhase`
  - `normalizeAnalysisResult`, `normalizeChatNodeResult`
  - `safeJsonParse`, `stripCodeFences`
- 노드/엣지 생성 규칙:
  - phase/category별 포지션 계산
  - cross-connection fallback 생성

### 3.2 Integration Tests
- Next API:
  - `POST /api/analyze` 정상/입력오류/키누락/모델포맷오류
  - `POST /api/chat` 정상/오류
  - `POST /api/chat-to-nodes` 정상/오류
- Optional Python API:
  - `/analyze`, `/chat`, `/chat-to-nodes` 기본 경로 응답

### 3.3 End-to-End Tests
1. 텍스트 입력 후 사용자 노드와 제안 카드 생성 확인
2. 제안 카드 클릭 시 초기 AI 설명 메시지 자동 생성 확인
3. 대화 후 노드 변환 버튼으로 그래프 병합 확인
4. API 오류 시 사용자 피드백(alert/메시지) 확인

### 3.4 Manual QA Checklist
- [ ] 첫 입력 제출 시 로딩 상태와 제출 버튼 disable 정상
- [ ] 제안 카드 dismiss 시 해당 카드 제거 및 활성 채팅 닫힘
- [ ] highlighted 노드가 시각적으로 강조됨
- [ ] 채팅 변환 후 `e-chat-*`, `e-cross-*` 엣지 스타일 반영
- [ ] 비-POST 호출 시 405 반환 확인
- [ ] 사용자 노출 텍스트(UI/오류/AI 응답)가 영어 전용인지 확인

## 4. Test Matrix

| ID | Layer | Scenario | Expected | Priority | Status |
|---|---|---|---|---|---|
| T-001 | API | analyze with valid text | 200 + nodes/edges | P0 | Planned |
| T-002 | API | analyze with empty text | 400 + error | P0 | Planned |
| T-003 | API | missing OPENAI_API_KEY | 500 + key error message | P0 | Planned |
| T-004 | UI+API | suggestion card 생성 | 카드 목록 증가 | P0 | Planned |
| T-005 | UI+API | chat turn | assistant reply 렌더 | P0 | Planned |
| T-006 | UI+API | chat-to-nodes | 그래프 노드/엣지 추가 | P0 | Planned |
| T-007 | Agent | malformed JSON from model | 보정 시도 또는 명시적 에러 | P1 | Planned |
| T-008 | Agent | cross-connection empty with history | fallback edge 생성 | P1 | Planned |
| T-009 | UI+API | language consistency | 사용자 노출 텍스트 영어 100% | P0 | Planned |

## 5. Go / No-Go Criteria
- P0 결함 0건
- `T-001`~`T-006` 전부 통과
- API key 누락/모델 형식오류 시 사용자 가시 오류 확인
- 롤백 절차 점검 완료

## 6. Release Plan

### 6.1 Pre-Release
1. 환경 변수 확인 (`OPENAI_API_KEY`)
2. 정적 점검 (`npm run lint`)
3. 핵심 API 스모크 호출
4. 릴리즈 승인

### 6.2 Deployment
1. 배포 실행
2. 애플리케이션 헬스 확인
3. 스모크 시나리오 실행
4. 릴리즈 노트 공유

### 6.3 Post-Release (first 30m)
- 에러율/응답시간 모니터링
- 실제 사용자 입력 1건 분석 시나리오 확인
- 제안 채팅 및 변환 시나리오 확인

## 7. Rollback Plan

### 7.1 Triggers
- 분석/채팅 API 지속 실패
- 사용자 핵심 경로 차단
- 5xx 급증 또는 모델 오류 폭증

### 7.2 Actions
1. 직전 안정 릴리즈로 즉시 롤백
2. 필요 시 기능 플래그 OFF(도입 시)
3. 장애 원인 기록 후 핫픽스 브랜치 생성
4. 재배포 전 회귀 테스트 재실행

## 8. Operations and Monitoring

### 8.1 Metrics
- API별 성공률/실패율
- API별 p95 latency
- 모델 호출 실패 비율

### 8.2 Logs
- endpoint, error message, stack trace
- invalid schema issue summary

### 8.3 Alerts
- 5xx 비율 임계치 초과
- p95 응답시간 임계치 초과

## 9. Known Test Gaps (Current)
1. Next API 경로 자동화 테스트가 아직 없다.
2. E2E 시나리오 자동화 도구가 정해지지 않았다.
3. Python backend 테스트는 단일 샘플 스크립트 수준이다.
