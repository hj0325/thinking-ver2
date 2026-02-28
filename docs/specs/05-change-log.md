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
### [Patch] 2026-02-28 - Orthogonal arc routing and adaptive port ordering applied
- Summary:
  - connector path를 Bezier 기반에서 `orthogonal + arc` 방식으로 전환해 직교 경로의 코너를 arc로 라운딩 처리했다.
  - 카드 역순/혼잡 배치에서 상하 우회 lane(ㄹ자 경로)을 사용하도록 라우팅 규칙을 적용했다.
  - fanout 오프셋을 확대(`step 26`, `max 104`)해 다중 포트 중첩을 완화했다.
  - 포트 슬롯을 상대 노드 Y 위치 기준으로 자동 정렬해 다중 연결 시 선 꼬임/교차를 줄였다.
  - 스펙/테스트 문서를 코드 구현값(arc, lane gap, fanout 수치, 정렬 규칙)으로 동기화했다.
- Scope: Frontend
- Files: `components/ThinkingMachine.jsx`, `components/edges/ConnectorEdge.jsx`, `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`
- Validation: 라우팅 함수와 슬롯 정렬 로직 수동 리뷰 완료; 자동 lint/build는 로컬 실행 바이너리 부재로 미실행
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`

### [Update] 2026-02-28 - Connector routing mode finalized as orthogonal + arc
- Summary:
  - 노드 연결선 경로 방식을 `orthogonal + arc corner`로 확정하고 `06-frontend-style`에 토큰(`--edge-routing-mode`, `--edge-corner-radius`)을 추가했다.
  - 카드 역순 배치 시 ㄹ자 우회 경로 및 arc 코너 처리 원칙을 overlap mitigation 규칙에 명시했다.
  - `04-test-rollout`에 arc 렌더링 검증 항목과 Test Matrix(`T-014`)를 추가했다.
- Scope: Frontend
- Files: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`
- Validation: 사용자 결정(`arc` 사용)과 connector spec/QA 항목 간 용어 및 규칙 일치 여부 대조 확인
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`

### [Patch] 2026-02-28 - Endpoint ports moved to node layer (above card)
- Summary:
  - endpoint 포트 원을 edge 레이어에서 제거하고 node 레이어로 이동해 카드 위에 표시되도록 수정했다.
  - 노드 스타일을 `overflow: visible`로 변경해 포트가 카드 측면에 반절 겹쳐 보이도록 조정했다.
  - edge는 선(path)만 렌더링하도록 단순화해 포트 중복 렌더링 문제를 제거했다.
- Scope: Frontend
- Files: `components/nodes/ThinkingNode.jsx`, `components/edges/ConnectorEdge.jsx`, `components/ThinkingMachine.jsx`, `docs/specs/06-frontend-style.md`, `docs/specs/05-change-log.md`
- Validation: 포트 렌더 책임(node)과 선 렌더 책임(edge) 분리 여부 수동 리뷰 확인
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`

### [Patch] 2026-02-28 - Connector edge fixes for overlap and direction issues
- Summary:
  - endpoint 포트 앵커를 카드 측면 중앙선(상단 기준 52px)으로 보정해 포트가 카드에 반쯤 겹치도록 수정했다.
  - 방향 정규화 로직을 추가해 `Problem`/`Solution` 연결은 `Problem -> Solution`으로 우선 렌더링하고, 그 외 연결은 좌->우 시각 흐름으로 렌더링한다.
  - edge 경로 시작/종료점을 포트 바깥으로 이동해 선이 카드 본문 아래로 가려지는 현상을 줄였다.
  - 관련 스펙/테스트 문서의 방향 규칙(`UI-010`, `T-012`)을 코드 동작에 맞게 동기화했다.
- Scope: Frontend
- Files: `components/ThinkingMachine.jsx`, `components/nodes/ThinkingNode.jsx`, `components/edges/ConnectorEdge.jsx`, `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`
- Validation: 변경 코드 경로/수식 수동 리뷰 완료; 자동 lint/build는 로컬 실행 바이너리 부재로 미실행
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`

### [Patch] 2026-02-28 - Connector edge UI implemented (V1 safe rollout)
- Summary:
  - ReactFlow를 custom node/edge 구성으로 전환해 노드 연결선을 `4px` 흰색 곡선으로 렌더링했다.
  - 양 끝 endpoint 포트(white ring + category color)를 edge 단에서 렌더링하고, 앵커는 노드 측면 `top: 52px` 기준으로 고정했다.
  - source/target 의미를 유지하기 위해 handle을 `right-source` -> `left-target`으로 고정하고, 노드 이동 시에도 source/target 스왑 없이 렌더링하도록 적용했다.
  - 다중 연결 겹침 완화를 위해 fanout 오프셋(`0, -6, +6, -12, +12`)을 적용하고, 카드 겹침 완화를 위해 clearance 기반 커브 경로를 적용했다.
  - `06-frontend-style`의 1차 실행 항목을 완료 처리하고 구현 타깃을 실제 파일 기준으로 동기화했다.
- Scope: Frontend
- Files: `components/NodeMap.jsx`, `components/ThinkingMachine.jsx`, `components/nodes/ThinkingNode.jsx`, `components/edges/ConnectorEdge.jsx`, `docs/specs/06-frontend-style.md`, `docs/specs/05-change-log.md`
- Validation: 변경 파일 수동 리뷰 완료; 자동 lint는 `eslint: command not found` 환경 이슈로 미실행
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`

### [Update] 2026-02-28 - Node connector edge spec and QA plan added
- Summary:
  - `06-frontend-style`에 노드 연결선 스펙(양 끝 포트, `top 52px`, `4px` 흰색 선, source/target 의미 유지)을 추가했다.
  - 다중 연결 겹침 대응(fanout 미세 분산)과 카드 본문 겹침 대응(clearance 라우팅) 규칙을 명시했다.
  - 1차(프론트 안전 적용)와 2차(정합 강화) 범위를 분리하고, 2차는 필요 이유와 함께 Follow-up To-do로 등록했다.
  - `04-test-rollout`에 connector 전용 수동 QA 및 Test Matrix(T-010~T-013)를 추가했다.
- Scope: Frontend
- Files: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`
- Validation: 사용자 확정값(양 끝 포트, 4px, 데이터 의미 유지)과 스펙/QA 항목 일치 여부 대조 확인
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`, `docs/specs/04-test-rollout.md`

### [Update] 2026-02-28 - Added detailed QA checklist for canvas pan and font policy
- Summary:
  - `04-test-rollout`에 Canvas pan 및 폰트 정책 검증을 위한 상세 수동 QA 체크리스트를 추가했다.
  - 마우스/트랙패드/터치 인터랙션, 커서 상태, 폰트 우선순위(`Instrument Sans` / `Inter`)와 폴백 렌더링 점검 항목을 포함했다.
  - 실행 순서를 통일하기 위한 권장 검증 절차(3.5.1)도 함께 추가했다.
- Scope: Frontend
- Files: `docs/specs/04-test-rollout.md`, `docs/specs/05-change-log.md`
- Validation: 체크리스트 항목이 `06-frontend-style` 확정 정책(UI-006/UI-007)과 일치하는지 대조 확인
- English-only Policy Impact: No
- Spec: `docs/specs/04-test-rollout.md`, `docs/specs/06-frontend-style.md`

### [Patch] 2026-02-28 - Canvas drag pan and global font policy applied
- Summary:
  - `NodeMap`에 빈 영역 기본 drag pan을 명시적으로 활성화하고(`panOnDrag`), 노드 drag 우선 동작을 유지하도록 설정했다.
  - 글로벌 UI 기본 폰트를 `Instrument Sans`로 전환하고, 제목급 텍스트(`h1~h6`, `.font-heading`)는 `Inter` 우선 정책으로 적용했다.
  - Node Card title/body 및 제안/채팅 타이틀에 폰트 정책을 반영하고, 프론트엔드 스펙 To-do 상태를 코드 반영 기준으로 완료 처리했다.
- Scope: Frontend
- Files: `components/NodeMap.jsx`, `components/ThinkingMachine.jsx`, `components/SuggestionPanel.jsx`, `components/ChatDialog.jsx`, `styles/globals.css`, `docs/specs/06-frontend-style.md`, `docs/specs/05-change-log.md`
- Validation: 수정 파일 라인 리뷰 완료; 정적 점검은 로컬 `eslint` 실행 결과에 따름
- English-only Policy Impact: No
- Spec: `docs/specs/06-frontend-style.md`

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
