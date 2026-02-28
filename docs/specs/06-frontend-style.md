# 06. Frontend and Style Spec

## Follow-up To-do
- [ ] [added: 2026-02-28] [status: decision-needed] Node image 비율/크롭 규칙(`cover` vs `contain`)을 Figma Inspect 기준으로 확정
- [ ] [added: 2026-02-28] [status: decision-needed] Title/Body 타이포(폰트 패밀리, 크기, 굵기, line-height) 확정
- [ ] [added: 2026-02-28] [status: decision-needed] 6하원칙 chip 토큰 이름(`--chip-when` vs `--chip-where`) 최종 확정
- [ ] [added: 2026-02-28] [status: execution-needed] Canvas 단계 전환 상태(stage state)와 배경 토큰(`data-stage`) 매핑 로직을 연결한다.
- [x] [added: 2026-02-28] [status: completed 2026-02-28] Canvas 단면 배경(base + 중앙 gradient) 스타일을 초기 stage(`research-diverge`) 기준으로 코드에 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] 관리자 모드 단축키(`Ctrl/Cmd+Shift+A`)와 초기 진입 안내 UI를 추가하고, 프로토타입 상태 배지를 관리자 모드로 제한
- [x] [added: 2026-02-28] [status: completed 2026-02-28] 빈 캔버스 드래그 pan(배경 이동) 인터랙션을 NodeMap에 반영
- [x] [added: 2026-02-28] [status: completed 2026-02-28] `Instrument Sans` 웹 폰트를 설치하고 기본 UI/Node 텍스트에 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] pan 동작의 modifier key 정책을 `기본 drag pan`으로 확정
- [x] [added: 2026-02-28] [status: completed 2026-02-28] `Instrument Sans` 적용 범위를 전체 UI로 확정하고, 제목급 텍스트는 `Inter` 예외 정책으로 확정
- [x] [added: 2026-02-28] [status: completed 2026-02-28] (1차) 노드 연결선 프론트 스타일(4px 흰 선, 연결 side 포트, 52px 앵커, fanout/clearance)을 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] 노드 연결선 코너 처리 방식을 `orthogonal + arc`로 확정
- [ ] [added: 2026-02-28] [status: execution-needed] (2차) 원인→결과 자동 정렬/정합 강화 규칙을 도입한다. 필요 이유: 현재는 source/target 의미 보존과 사용자 수동 배치 의도를 우선해야 하므로, 강제 재정렬은 의미 왜곡/UX 충돌 리스크가 있어 별도 단계로 분리

## 1. Document Meta
- Version: `v0.5-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`
- Related Mockups:
  - Figma: `ccid-Visual-Thinking-Machine` (`node-id=566-870`)
  - Node reference image: user-provided card preview (Title + body + chips)
  - Node image variant reference: user-provided card preview (Title + body + image + chips)

## 2. Purpose
목업 기반 프론트엔드 구조와 스타일 규칙을 명시한다.  
현재 문서는 **Node Card + Canvas Background** 디자인 규칙을 중심으로 확정/가확정 값을 정리한다.

## 3. Visual Direction
- Keywords: `clean`, `compact`, `semantic chips`, `idea summary`
- Tone: professional, minimal, readable
- Do: 짧은 요약 + 핵심 메타(category/phase)를 한 카드에서 즉시 인지
- Don't: 과한 장식, 긴 본문 노출, 불명확한 색상 의미

## 4. Screen Inventory
| Screen | Route | Purpose | Source Mockup |
|---|---|---|---|
| Main Canvas | `/` |  |  |
|  |  |  |  |

## 5. Layout Template
### 5.1 Global Layout
- Header:
- Main:
- Side Panel:
- Dialog/Overlay:

### 5.2 Grid and Spacing
- Base grid:
- Container width:
- Spacing scale:

## 6. Design Tokens
### 6.1 Color Tokens
| Token | Hex | Usage |
|---|---|---|
| `--node-bg` | `#FFFFFF` | Node Card 배경 |
| `--node-title` | `#4A4A4A` | Node title 텍스트 |
| `--node-body` | `#666666` | Node body 텍스트 |
| `--chip-when-bg` | `#9DBCFF` | `When` chip 배경 |
| `--chip-where-bg` | `#E6E8B4` | `Where` chip 배경 |
| `--chip-how-bg` | `#8FE5EA` | `How` chip 배경 |
| `--chip-what-bg` | `#97E9C0` | `What` chip 배경 |
| `--chip-why-bg` | `#D2EEA1` | `Why` chip 배경 |
| `--chip-who-bg` | `#A999F1` | `Who` chip 배경 |
| `--chip-problem-bg` | `#EFAEA8` | `Problem` chip 배경 |
| `--chip-solution-bg` | `#E8A0E6` | `Solution` chip 배경 |
| `--chip-text` | `#111111` | 공통 chip 텍스트 |
| `--canvas-bg-base` | `#A6FFD3` | 단면 캔버스 기본 배경 |
| `--canvas-stage-research-diverge` | `#4DD6F8` | 리서치 확산 단계 중심 gradient 색상 |
| `--canvas-stage-research-converge` | `#FFFF86` | 리서치 수렴 단계 중심 gradient 색상 |
| `--canvas-stage-ideation-diverge` | `#FF969F` | 아이디에이션 확산 단계 중심 gradient 색상 |
| `--canvas-stage-ideation-converge` | `#D5A6FF` | 아이디에이션 수렴 단계 중심 gradient 색상 |
| `--canvas-gradient-center-x` | `50%` | 중심 gradient X 위치 |
| `--canvas-gradient-center-y` | `80%` | 중심 gradient Y 위치 |
| `--canvas-gradient-radius-x` | `60%` | 중심 gradient 가로 반경 |
| `--canvas-gradient-radius-y` | `78%` | 중심 gradient 세로 반경 |

### 6.2 Typography Tokens
| Token | Value | Usage |
|---|---|---|
| `--font-family-ui` | `"Instrument Sans", "Inter", "system-ui", sans-serif` | 앱 공통 UI 텍스트 (default) |
| `--font-family-heading` | `"Inter", "Instrument Sans", "system-ui", sans-serif` | 제목급 텍스트 (Node Card title 포함) |
| `--font-family-node-body` | `"Instrument Sans", "Inter", "system-ui", sans-serif` | Node body/보조 텍스트 |
| `--font-size-node-title` | TBD | Title(summary) 라인 |
| `--font-size-node-body` | TBD | 본문 미리보기 텍스트 |
| `--font-weight-node-title` | TBD | Title 강조 |
| `--line-height-node-title` | TBD | Title 가독성 |
| `--line-height-node-body` | TBD | Body 가독성 |

### 6.5 Interaction Tokens (Canvas Pan)
| Token | Value | Usage |
|---|---|---|
| `--canvas-pan-enabled` | `true` | 빈 캔버스 drag 이동 활성화 |
| `--canvas-pan-mode` | `drag-empty-space` (default) | pan 트리거 방식 |
| `--canvas-pan-modifier` | `none` (resolved) | modifier key 요구 여부 |
| `--admin-shortcut` | `Ctrl/Cmd + Shift + A` | 관리자 모드 토글 단축키 |
| `--admin-mode-default` | `off` | 초기 관리자 모드 상태 |
| `--admin-shortcut-hint` | `on-first-entry` | 초기 진입 시 단축키 안내 노출 정책 |

### 6.3 Radius / Shadow / Border
| Token | Value | Usage |
|---|---|---|
| `--radius-node` | `30px` | Node 카드 외곽 |
| `--shadow-node` | `0 8px 24px -12px rgba(0,0,0,0.22)` | Node 카드 그림자 |
| `--border-node` | `none` | Node 카드 보더 |
| `--radius-chip` | pill (`9999px`) | Category/Phase chip |
| `--radius-node-image` | `30px` | Node 내부 이미지 라운드 |

### 6.4 Spacing Tokens
| Token | Value | Usage |
|---|---|---|
| `--space-node-x` | `11px` | Node 좌/우 패딩 |
| `--space-node-top` | `16px` | Node 상단 패딩 |
| `--space-node-bottom` | `12px` | Node 하단 패딩 |
| `--space-node-gap` | `12px` | Node 내부 블록 간격 |
| `--space-node-image-h` | `136px` | Node 이미지 영역 높이 (code 기준) |
| `--chip-pad-y` | `6px` | Chip 수직 패딩 |
| `--chip-pad-x` | `8px` | Chip 수평 패딩 |
| `--chip-gap-inner` | `4px` | Chip 내부 gap |

### 6.6 Connector Tokens
| Token | Value | Usage |
|---|---|---|
| `--edge-line-color` | `#FFFFFF` | 노드 간 연결선 기본 색상 |
| `--edge-line-width` | `4px` | 노드 간 연결선 두께 (확정) |
| `--edge-port-offset-top` | `52px` | 카드 상단 기준 포트 Y 기준점 |
| `--edge-port-outer-size` | `20px` | 포트 외곽 원(white ring 포함) |
| `--edge-port-inner-size` | `12px` | 포트 내부 컬러 원 |
| `--edge-port-ring-color` | `#FFFFFF` | 포트 외곽 링 색상 |
| `--edge-clearance-x` | `20px` | 카드에서 선이 빠져나갈 최소 수평 이격 |
| `--edge-fanout-step` | `26px` | 다중 엣지 미세 분산 간격 (포트 중첩 방지) |
| `--edge-fanout-max` | `104px` | 다중 엣지 미세 분산 최대 절대값 |
| `--edge-routing-mode` | `orthogonal-arc` | 직교 경로 + arc 코너 방식 |
| `--edge-corner-radius` | `24px` (initial) | 직교 코너 arc 반지름 |
| `--edge-lane-gap` | `80px` | 역순/혼잡 배치 시 상하 우회 lane 간격 |

## 7. Component Style Template
| Component | Structure | States | Variant | Notes |
|---|---|---|---|---|
| Input Panel |  | default/disabled/loading |  |  |
| Suggestion Card |  | default/active/hover | category-based |  |
| Chat Dialog |  | open/loading/error |  |  |
| Node Card | `summary + body + (optional image) + chips` | default/highlighted | text-only / image | this section is detailed below |
| Canvas Stage Background | `single-surface fill + central stage gradient` | fixed-stage (initial) | 4 stage color presets | right-edge glow excluded |
| Canvas Pan Interaction | `empty-space drag` | idle/panning/dragging-node | modifier/no-modifier | NodeMap interaction spec |
| Node Connector Edge | `edge + connected-side endpoint ports` | default/highlighted/overlapped | input/chat/cross | logical flow with fixed source/target semantics |
| Admin Shortcut + Status Overlay | `shortcut hint + admin status badge` | hint-visible/admin-off/admin-on | first-entry / dismissed | prototype status visibility control |

### 7.1 Node Card (Mockup V1 Spec)
#### A. Container
- `display: flex`
- `width: 232px`
- `padding: 16px 16px 12px 16px`
- `flex-direction: column`
- `align-items: flex-start`
- `gap: 12px`
- border: `none`
- background: `#FFF`
- border-radius: `30px`
- typography:
  - title-level text uses `--font-family-heading` (`Inter` priority)
  - body/supporting text uses `--font-family-node-body` (`Instrument Sans` priority)

#### B. Content Structure
1. Title line:
   - format: `Title(summary) - <summary text>`
   - example: `Title(summary) - Lorem Ipsum is simply dummy text`
   - purpose: 핵심 의미를 한 줄에서 요약
2. Body preview:
   - example: `These keywords are grouped into a sense of speed, energy explosion, ...`
   - 줄 수: 최대 3줄(overflow 시 말줄임)
3. Optional image block:
   - shown only when `imageUrl` exists in node data
   - style: full width, `height: 136px`, `border-radius: 30px`, `object-fit: cover`
4. Metadata chip row:
   - chips displayed left-to-right
   - default order: `Category` then `Phase`
   - example: `When` + `Problem`

#### C. Chip Rules
- chip shape: pill (`--radius-chip`)
- chip text language: English only
- category chip color: semantic by category
- phase chip color:
  - `Problem`: red family
  - `Solution`: pink/purple family

#### D. Interaction / State
- `default`: base style
- `highlighted`: used when node is linked to active suggestion
- `hover`/`active` specifics: TBD (if needed for interactive nodes)

#### E. Language Policy
- Node card user-visible text is English-only.
- Title/body generated from AI must be rendered in English.

#### F. Data Binding (Image Variant)
- title source: `data.label`
- body source: `data.content`
- category chip source: `data.category`
- phase chip source: `data.phase`
- image source: `data.image_url` or `data.imageUrl` (optional)

### 7.2 Chip Component (5W1H + Phase) - Mockup V1
#### A. Base Style (shared)
- `display: inline-flex`
- `padding: 6px 8px`
- `justify-content: center`
- `align-items: center`
- `gap: 10px`
- `border-radius: 99px`
- border: `none`
- text: short single-word label (`When`, `Where`, `How`, `What`, `Why`, `Who`, `Problem`, `Solution`)

#### B. Variant Colors
| Chip | Background | Text |
|---|---|---|
| `When` | `var(--chip-when-bg, #9DBCFF)` | `var(--chip-text, #111111)` |
| `Where` | `var(--chip-where-bg)` | `var(--chip-text, #111111)` |
| `How` | `var(--chip-how-bg)` | `var(--chip-text, #111111)` |
| `What` | `var(--chip-what-bg)` | `var(--chip-text, #111111)` |
| `Why` | `var(--chip-why-bg)` | `var(--chip-text, #111111)` |
| `Who` | `var(--chip-who-bg)` | `var(--chip-text, #111111)` |
| `Problem` | `var(--chip-problem-bg)` | `var(--chip-text, #111111)` |
| `Solution` | `var(--chip-solution-bg)` | `var(--chip-text, #111111)` |

#### C. Note on Provided Style Snippet
- 제공된 스니펫(`background: var(--Chips-When, #9DBCFF);`)은 색상값 기준으로 `When` chip에 매칭된다.
- 문구상 `Where` 스타일로 전달되었으므로, 토큰 네이밍은 UI-005에서 최종 확정한다.

### 7.3 Canvas Background (Single-Surface Stage Gradient)
#### A. Goal
- 기존 `Problem/Solution` 2분할 배경을 제거하고 단면(single-surface) 캔버스를 사용한다.
- 기본 배경(`--canvas-bg-base`) 위에 중앙 radial gradient를 중첩해 단계별 분위기만 교체 가능하게 설계한다.

#### B. Visual Rules
1. Base fill:
   - color: `--canvas-bg-base` (`#A6FFD3`)
2. Central gradient:
   - type: radial gradient
   - position: `50% 80%`
   - size: `60% x 78%`
   - stage color: 아래 단계 토큰 중 1개 선택
     - research-diverge: `--canvas-stage-research-diverge` (`#4DD6F8`)
     - research-converge: `--canvas-stage-research-converge` (`#FFFF86`)
     - ideation-diverge: `--canvas-stage-ideation-diverge` (`#FF969F`)
     - ideation-converge: `--canvas-stage-ideation-converge` (`#D5A6FF`)
3. Exclusion:
   - 우측 edge glow(세로형 yellow strip)는 현재 범위에서 적용하지 않는다.

#### C. Stage Policy (Initial)
- 현재 구현 범위는 프론트 스타일 고정값이다.
- 초기 기본 stage는 `research-diverge`를 사용한다.
- 단계 전환 로직은 이후 작업으로 분리한다(`Follow-up To-do` 참조).

#### D. Implementation Targets
- `components/NodeMap.jsx`:
  - 기존 배경 분할 레이어 제거
  - 단일 배경 레이어 클래스 적용
- `styles/globals.css`:
  - canvas 배경 토큰 및 stage별 gradient 스타일 정의
- `components/ThinkingMachine.jsx`:
  - 필요 시 stage 전달 prop/data attribute 정의 (초기에는 고정값 허용)

### 7.4 Canvas Pan Interaction (Miro/Figma-style)
#### A. Goal
- 사용자가 빈 배경 영역을 drag할 때 캔버스(viewport)가 이동해야 한다.
- 노드를 drag할 때는 노드 이동이 우선되어야 하며 pan이 개입하면 안 된다.

#### B. Behavior Rules
1. Empty-space drag:
   - action: viewport pan
   - cursor: `grab`(idle) -> `grabbing`(panning)
2. Node drag:
   - action: node move only
   - pan disabled while node is actively dragged
3. Wheel/trackpad:
   - 기존 zoom/scroll 동작 유지
4. Touch:
   - single-finger drag: pan
   - pinch: zoom

#### C. Key Policy (Resolved)
- 확정 정책: modifier 없는 빈 영역 drag pan
- `Space + drag` 제한 모드는 현재 범위에서 적용하지 않음

#### D. Implementation Targets
- file: `components/NodeMap.jsx`
- primary config:
  - ReactFlow pan 설정 활성화
  - 노드 drag와 pan 충돌 방지 설정
- QA baseline:
  - 노드/엣지가 많은 상태에서도 프레임 드랍 없이 drag pan 동작

### 7.5 Admin Shortcut and Prototype Status Overlay
#### A. Goal
- 프로토타입/디버그 상태 정보는 일반 화면에서 숨기고 관리자 모드에서만 노출한다.
- 사용자가 최초 진입 시 단축키를 인지할 수 있도록 안내 UI를 제공한다.

#### B. Shortcut Policy
1. Toggle key:
   - `Ctrl/Cmd + Shift + A`
2. Default state:
   - `admin mode = off`
3. Persistence:
   - admin mode: `localStorage`
   - shortcut hint dismissed state: `sessionStorage`

#### C. UI Rules
1. Initial entry shortcut hint:
   - 위치: 상단 중앙
   - 내용: `Press Ctrl/Cmd + Shift + A to toggle Admin Mode.`
   - 액션: `Dismiss`
2. Admin status overlay (admin mode on):
   - 위치: 상단 우측
   - 표시 항목:
     - `Admin Mode` badge
     - `Autonomous Agent Active`
     - runtime counts (`Nodes`, `Suggestions`)
3. Admin mode off:
   - 프로토타입 상태 배지는 렌더링하지 않는다.

#### D. Implementation Targets
- `components/ThinkingMachine.jsx`:
  - keyboard listener, admin mode/hint state 관리
  - overlay UI 렌더 조건 제어
- `styles/globals.css`:
  - 필요 시 오버레이 스타일 토큰 확장

### 7.6 Node Connector Edge (Mockup V2)
#### A. Scope and Rollout
- 이번 범위(1차): 프론트엔드 안전 적용
  - 연결선/포트 시각 스타일
  - 포트 위치(상단 52px), 선 굵기(4px), 카드 겹침 회피 라우팅
  - source/target 의미를 유지한 방향 고정
- 다음 범위(2차): 정합 강화 로직
  - 원인→결과 자동 정렬 및 재배치 정책은 To-do로만 유지

#### B. Visual Rules (Resolved)
1. Edge line:
   - color: `--edge-line-color` (`#FFFFFF`)
   - width: `--edge-line-width` (`4px`)
   - routing: `orthogonal + arc corner` (수평/수직 세그먼트 + 둥근 코너)
2. Endpoint ports:
   - 각 edge의 양 끝점은 표시하되, 노드 기준으로는 연결이 존재하는 side에만 포트를 표시
   - outer: white ring circle
   - inner: 해당 노드 `category`의 chip color
   - z-layer: node layer에서 렌더링하여 카드 위로 노출
3. Port position:
   - 카드 측면 기준 `top: 52px` 지점
   - source는 우측 포트, target은 좌측 포트
4. Data semantics:
   - 방향 정규화 규칙:
     - `Problem`/`Solution` 쌍은 항상 `Problem -> Solution`
     - 그 외 케이스는 좌->우 시각 흐름을 우선
   - 위 규칙은 프론트 렌더 단계에서 적용한다.

#### C. Overlap Risk Mitigation
1. Multi-edge overlap (same side, same node):
   - `52px` 기준점을 유지하면서 미세 분산(fanout) 적용
   - offset is derived from slot order and total degree per side
   - offset sequence example: `0, -26, +26, -52, +52`
   - fanout 범위는 `--edge-fanout-max` 이내
   - slot order는 상대 노드의 Y 위치 기준으로 자동 정렬(위 연결은 위 포트, 아래 연결은 아래 포트)
2. Card overlap (line crossing card body):
   - 카드 측면 포트에서 즉시 수평 이탈(`--edge-clearance-x`) 후 경로 진행
   - source clear point -> orthogonal lane -> target clear point -> target 포트 순으로 경로 구성
   - 각 꺾임점은 `arc`로 라운딩 처리(`--edge-corner-radius`)
   - source/target의 Y 범위가 벌어진 경우, 외곽 우회보다 두 카드 사이 corridor 경로를 우선 선택
   - 목적: 선이 카드 본문/라운드 코너 영역을 가로지르지 않도록 보장
3. Reverse placement (right-to-left layouts):
   - 노드가 역순으로 배치된 경우 상/하 우회 lane(`--edge-lane-gap`)을 통해 ㄹ자 경로를 우선 적용
   - 코너는 동일하게 arc 라운딩 처리

#### D. Logical Flow Policy
- 현재 정책: `Problem -> Solution` 우선 + 좌->우 시각 흐름 정규화
- 원인/결과 자동 재정렬은 2차 범위에서 별도 도입

#### E. Implementation Targets
- `components/NodeMap.jsx`:
  - custom `nodeTypes`, `edgeTypes` 연결
  - edge routing 관련 설정
- `components/ThinkingMachine.jsx`:
  - edge 데이터에 `sourceHandle`/`targetHandle` 명시
  - edge 메타(category, fanout index) 전달
- `styles/globals.css`:
  - connector/port 토큰 스타일 정의
- `components/nodes/ThinkingNode.jsx`:
  - 연결된 좌/우 side만 포트 렌더링
- `components/edges/ConnectorEdge.jsx`:
  - custom orthogonal path + arc corner + fanout + clearance routing

## 8. Motion and Interaction
- Page transition:
- Panel transition:
- Hover/active behavior:
- Loading behavior:
- Reduced motion policy:
- Canvas interaction:
  - empty-space drag pan enabled
  - node drag precedence over pan
  - cursor affordance (`grab`/`grabbing`)
  - single-surface stage gradient background (base + central radial)
  - shortcut hint appears on first entry (`Ctrl/Cmd + Shift + A`)
  - prototype status overlay is visible only in admin mode
- Edge interaction:
  - direction normalized (`Problem -> Solution`, else left-to-right`)
  - endpoint ports shown only on connected sides (per node)
  - fanout and clearance routing for overlap prevention
  - orthogonal + arc corner path for readability and overlap avoidance

## 9. Responsive Rules
| Breakpoint | Rule |
|---|---|
| Mobile |  |
| Tablet |  |
| Desktop |  |

## 10. Accessibility Checklist
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation for major actions
- [ ] Focus ring visibility
- [ ] Screen-reader label completeness
- [ ] Motion alternatives for reduced-motion users

## 11. Implementation Mapping
| Spec Area | File/Directory |
|---|---|
| Screen composition | `components/*`, `pages/index.jsx` |
| Global style | `styles/globals.css` |
| Visual graph layer | `components/NodeMap.jsx` |
| Interaction panels | `components/InputPanel.jsx`, `components/SuggestionPanel.jsx`, `components/ChatDialog.jsx` |
| Web font loading (`Instrument Sans`) | `styles/globals.css` |
| Heading font exception (`Inter` priority) | `components/ThinkingMachine.jsx`, `components/SuggestionPanel.jsx`, `components/ChatDialog.jsx`, `styles/globals.css` |
| Canvas single-surface stage background | `components/NodeMap.jsx`, `styles/globals.css` |
| Canvas pan behavior | `components/NodeMap.jsx` |
| Admin shortcut / prototype status overlay | `components/ThinkingMachine.jsx` |
| Connector edge style/routing | `components/NodeMap.jsx`, `components/ThinkingMachine.jsx`, `styles/globals.css`, `components/nodes/ThinkingNode.jsx`, `components/edges/ConnectorEdge.jsx` |

## 12. Open Questions
| ID | Question | Owner | Due Date | Status |
|---|---|---|---|---|
| UI-001 | Node card outer radius exact value(및 코너 형태)는? |  |  | Resolved (`30px`, 2026-02-28) |
| UI-002 | Title/body typography exact token 값은? |  |  | Open |
| UI-003 | `Solution` chip color token은 무엇으로 확정할지? |  |  | Resolved (`#E8A0E6`, 2026-02-28) |
| UI-004 | Node hover/active state가 목업 범위에 포함되는지? |  |  | Open |
| UI-005 | 전달된 `Where` 스타일의 토큰 이름이 `--Chips-When`인 이유(오타/의도) 확인 필요 |  |  | Open |
| UI-006 | Canvas pan을 기본 drag로 둘지, `Space+drag`로 제한할지? |  |  | Resolved (기본 drag pan, 2026-02-28) |
| UI-007 | `Instrument Sans` 적용 범위를 전체 UI로 확장할지 Node/Card 우선으로 둘지? |  |  | Resolved (전체 UI + 제목급 Inter 예외, 2026-02-28) |
| UI-008 | 노드 연결선 포트 표시 범위를 시작점만/양 끝점 모두 중 무엇으로 할지? |  |  | Resolved (edge 양 끝점 기준 + 노드에서는 연결된 side만 표시, 2026-02-28) |
| UI-009 | 노드 연결선 두께를 몇 px로 확정할지? |  |  | Resolved (`4px`, 2026-02-28) |
| UI-010 | 노드 좌우 이동 후 방향 처리를 source/target 스왑할지 여부 |  |  | Resolved (Problem->Solution 우선 정규화 + 좌->우 정렬, 2026-02-28) |
| UI-011 | 직교 경로 코너 처리 방식을 `arc`/`quadratic` 중 무엇으로 할지 |  |  | Resolved (`arc`, 2026-02-28) |
| UI-012 | Canvas stage 전환 트리거를 어떤 상태값/이벤트로 연결할지? |  |  | Open |
| UI-013 | Canvas 우측 edge glow를 포함할지? |  |  | Resolved (미포함, 2026-02-28) |
| UI-014 | 관리자 단축키를 어떤 키 조합으로 고정할지? |  |  | Resolved (`Ctrl/Cmd + Shift + A`, 2026-02-28) |
