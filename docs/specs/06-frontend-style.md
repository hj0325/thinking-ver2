# 06. Frontend and Style Spec

## Follow-up To-do
- [ ] [added: 2026-02-28] [status: decision-needed] Node image 비율/크롭 규칙(`cover` vs `contain`)을 Figma Inspect 기준으로 확정
- [ ] [added: 2026-02-28] [status: decision-needed] Title/Body 타이포(폰트 패밀리, 크기, 굵기, line-height) 확정
- [ ] [added: 2026-02-28] [status: decision-needed] 6하원칙 chip 토큰 이름(`--chip-when` vs `--chip-where`) 최종 확정
- [ ] [added: 2026-02-28] [status: execution-needed] 빈 캔버스 드래그 pan(배경 이동) 인터랙션을 NodeMap에 반영
- [ ] [added: 2026-02-28] [status: execution-needed] `Instrument Sans` 웹 폰트를 설치하고 기본 UI/Node 텍스트에 적용
- [x] [added: 2026-02-28] [status: completed 2026-02-28] pan 동작의 modifier key 정책을 `기본 drag pan`으로 확정
- [x] [added: 2026-02-28] [status: completed 2026-02-28] `Instrument Sans` 적용 범위를 전체 UI로 확정하고, 제목급 텍스트는 `Inter` 예외 정책으로 확정

## 1. Document Meta
- Version: `v0.4-draft`
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
현재 문서는 우선 **Node Card 디자인**을 중심으로 확정/가확정 값을 정리한다.

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

## 7. Component Style Template
| Component | Structure | States | Variant | Notes |
|---|---|---|---|---|
| Input Panel |  | default/disabled/loading |  |  |
| Suggestion Card |  | default/active/hover | category-based |  |
| Chat Dialog |  | open/loading/error |  |  |
| Node Card | `summary + body + (optional image) + chips` | default/highlighted | text-only / image | this section is detailed below |
| Canvas Pan Interaction | `empty-space drag` | idle/panning/dragging-node | modifier/no-modifier | NodeMap interaction spec |

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

### 7.3 Canvas Pan Interaction (Miro/Figma-style)
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
| Web font loading (`Instrument Sans`) | `pages/_app.jsx`, `styles/globals.css` |
| Canvas pan behavior | `components/NodeMap.jsx` |

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
