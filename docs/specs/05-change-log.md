# 05. Change Log (Future Patches Only)

## Follow-up To-do
- [ ] [added: 2026-02-28] [P0] [status: governance-ongoing] 다음 패치부터 언어 정책 관련 변경은 본 문서에 반드시 기록한다.
- [x] [added: 2026-02-28] [P1] [status: completed 2026-02-28] 템플릿 단순화 후에도 필수 메타(요약/파일/검증)는 유지한다.

## 1. Purpose
- 이 문서는 **앞으로 발생하는 코드 업데이트/패치 내역만 기록**한다.
- 과거 변경사항 백필은 범위에서 제외한다.

## 2. Logging Rules
1. 최신 항목을 상단에 기록한다.
2. `Update`(기능/개선)와 `Patch`(버그/수정)를 구분한다.
3. 코드 변경이 발생한 모든 턴에서 본 문서에 엔트리를 추가한다.
4. 엔트리는 6개 필드만 유지한다: `Summary`, `Scope`, `Files`, `Validation`, `English-only Policy Impact`, `Spec`.

## 3. Entry Template
```md
### [Update|Patch] YYYY-MM-DD - <Short Title>
- Summary:
- Scope: Frontend | API | AI Logic | Backend | Mixed
- Files: `<path1>`, `<path2>`
- Validation:
- English-only Policy Impact: Yes | No
- Spec: `<spec-path>`
```

## 4. Change Entries
### [Update] 2026-02-28 - UI-006/UI-007 decisions finalized in frontend spec
- Summary:
  - `UI-006`을 `기본 drag pan`으로 확정하고, Canvas pan modifier를 `none`으로 고정했다.
  - `UI-007`을 `전체 UI Instrument Sans`로 확정하되, 제목급 텍스트(예: Node Card title)는 `Inter` 우선 정책으로 명시했다.
  - `06-frontend-style`의 Follow-up To-do 및 Open Questions 상태를 `Resolved/Completed`로 동기화했다.
- Scope: Frontend
- Files: `docs/specs/06-frontend-style.md`, `docs/specs/05-change-log.md`
- Validation: 결정 응답(사용자 코멘트)과 토큰/컴포넌트/오픈질문 섹션 간 일관성 대조 확인
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`

### [Update] 2026-02-28 - Spec proposal added for canvas pan and Instrument Sans
- Summary:
  - `06-frontend-style`에 Miro/Figma 스타일의 캔버스 빈 영역 drag pan 인터랙션 스펙(행동 규칙, 우선순위, 구현 타깃)을 추가했다.
  - `Instrument Sans` 웹폰트 도입 방향을 타이포 토큰/구현 매핑에 반영하고, 미확정 의사결정 항목을 Open Questions로 등록했다.
- Scope: Frontend
- Files: `docs/specs/06-frontend-style.md`, `docs/specs/05-change-log.md`
- Validation: 스펙 섹션(토큰/컴포넌트/인터랙션/구현 매핑/오픈질문) 간 참조 일관성 확인
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`

### [Patch] 2026-02-28 - Node card/chip spacing aligned to updated frontend spec
- Summary:
  - `06-frontend-style` 최신 수치에 맞춰 Node Card 내부 패딩과 chip 내부 gap을 코드에 반영했다.
  - Node Card content wrapper padding을 `16px 16px 12px 16px`로 정렬하고, chip inner gap을 `4px`로 조정했다.
- Scope: Frontend
- Files: `components/ThinkingMachine.jsx`, `docs/specs/05-change-log.md`
- Validation: 코드 클래스 값(`px-4 pb-3 pt-4`, `gap-1`)을 스펙 토큰과 대조 확인
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`

### [Patch] 2026-02-28 - English-only prompt policy enforced in JS/Python
- Summary:
  - JS/Python `analyze` 및 `chat-to-nodes` 프롬프트에 사용자 노출 텍스트 영어 강제 규칙을 추가했다.
  - JS `repairToSchema` 보정 프롬프트에도 user-visible 텍스트 영어 출력 규칙을 추가했다.
  - `02-requirements`의 관련 P1 To-do를 완료 처리했다.
- Scope: AI Logic
- Files: `lib/thinkingAgent.js`, `backend/logic.py`, `docs/specs/02-requirements.md`, `docs/specs/05-change-log.md`
- Validation: 프롬프트 문자열 라인 단위 확인(영어 강제 문구 추가 여부)
- English-only Policy Impact: Yes
- Spec: `docs/specs/02-requirements.md`, `docs/specs/03-architecture.md`

### [Update] 2026-02-28 - English-only policy decision finalized
- Summary:
  - 영어 전용 정책 범위를 확정했다(UI/오류/API 오류/AI 응답/fallback 포함, 사용자 원문 입력은 예외).
  - 전환 일정은 고정 목표일 없이 Production 기준 단계적 적용으로 확정했다(동결 금지).
  - Optional Python backend를 정책 범위에 포함하도록 요구사항/테스트 문서를 갱신했다.
- Scope: Mixed
- Files: `docs/specs/01-overview.md`, `docs/specs/02-requirements.md`, `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`
- Validation: 사용자 의사결정 응답 10개 항목과 스펙 문서 반영 내용 대조
- English-only Policy Impact: Yes
- Spec: `docs/specs/01-overview.md`, `docs/specs/02-requirements.md`, `docs/specs/04-test-rollout.md`

### [Update] 2026-02-28 - README and operations docs aligned to Pages Router
- Summary:
  - `README.md`를 현재 `pages` 구조와 실제 런타임 경로(Next API 중심) 기준으로 전면 갱신했다.
  - 운영 runbook 문서 `docs/OPERATIONS.md`를 추가하고, `01-overview`의 관련 To-do를 완료 처리했다.
- Scope: Mixed
- Files: `README.md`, `docs/OPERATIONS.md`, `docs/specs/01-overview.md`, `docs/specs/05-change-log.md`
- Validation: 문서 경로/엔드포인트/실행 명령을 코드 구조와 대조해 확인
- English-only Policy Impact: No
- Spec: `docs/specs/01-overview.md`, `docs/specs/04-test-rollout.md`

### [Update] 2026-02-28 - Spec To-do triage and status tagging
- Summary:
  - `01~06` 스펙 문서 Follow-up To-do를 `completed / execution-needed / decision-needed` 상태로 재분류했다.
  - 완료 항목(아키텍처의 `onConnect` 정리, JS fallback 영어화, change-log 템플릿 메타 유지)을 체크 처리했다.
- Scope: Mixed
- Files: `docs/specs/01-overview.md`, `docs/specs/02-requirements.md`, `docs/specs/03-architecture.md`, `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`, `docs/specs/06-frontend-style.md`
- Validation: 문서와 코드 현황을 라인 단위로 대조해 상태를 확정함
- English-only Policy Impact: No
- Spec: `docs/specs/01-overview.md`, `docs/specs/02-requirements.md`, `docs/specs/03-architecture.md`, `docs/specs/04-test-rollout.md`, `docs/specs/06-frontend-style.md`

### [Update] 2026-02-28 - Node Card UI refinement and image-ready variant
- Summary:
  - Node card를 mockup 기준(`232px`, `16/11/12/11`, `radius 30`, white bg)으로 조정했다.
  - 이미지 포함 variant 렌더를 추가했다(`image_url`/`imageUrl` 등 optional).
- Scope: Frontend
- Files: `components/ThinkingMachine.jsx`, `styles/globals.css`, `docs/specs/06-frontend-style.md`, `docs/specs/05-change-log.md`
- Validation: 수동 코드 리뷰 완료, `npm run lint`는 `eslint: command not found`로 미실행
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`

## 5. Release Mapping
| Release Version | Date | Included Entries | Notes |
|---|---|---|---|
