# 06. Frontend and Style Spec

## Follow-up To-do
- [ ] [added: 2026-02-28] Node Card radius 값을 Figma Inspect 기준으로 확정
- [ ] [added: 2026-02-28] Node Card 색상(hex) 토큰 확정
- [ ] [added: 2026-02-28] Title/Body 타이포(폰트 패밀리, 크기, 굵기, line-height) 확정
- [ ] [added: 2026-02-28] 6하원칙 chip 토큰 이름(`--chip-when` vs `--chip-where`) 최종 확정

## 1. Document Meta
- Version: `v0.2-draft`
- Status: `Draft`
- Owner: TBD
- Reviewers: TBD
- Last Updated: `2026-02-28`
- Related Mockups:
  - Figma: `ccid-Visual-Thinking-Machine` (`node-id=566-870`)
  - Node reference image: user-provided card preview (Title + body + chips)

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
| `--node-bg` | TBD | Node Card 배경 |
| `--node-title` | TBD | Node title 텍스트 |
| `--node-body` | TBD | Node body 텍스트 |
| `--chip-when-bg` | `#9DBCFF` | `When` chip 배경 |
| `--chip-where-bg` | provisional (from mockup) | `Where` chip 배경 |
| `--chip-how-bg` | provisional (from mockup) | `How` chip 배경 |
| `--chip-what-bg` | provisional (from mockup) | `What` chip 배경 |
| `--chip-why-bg` | provisional (from mockup) | `Why` chip 배경 |
| `--chip-who-bg` | provisional (from mockup) | `Who` chip 배경 |
| `--chip-problem-bg` | provisional (from mockup) | `Problem` chip 배경 |
| `--chip-solution-bg` | provisional (from mockup) | `Solution` chip 배경 |
| `--chip-text` | `#111111` | 공통 chip 텍스트 |

### 6.2 Typography Tokens
| Token | Value | Usage |
|---|---|---|
| `--font-family-node` | TBD | Node title/body |
| `--font-size-node-title` | TBD | Title(summary) 라인 |
| `--font-size-node-body` | TBD | 본문 미리보기 텍스트 |
| `--font-weight-node-title` | TBD | Title 강조 |
| `--line-height-node-title` | TBD | Title 가독성 |
| `--line-height-node-body` | TBD | Body 가독성 |

### 6.3 Radius / Shadow / Border
| Token | Value | Usage |
|---|---|---|
| `--radius-node` | TBD | Node 카드 외곽 |
| `--shadow-node` | TBD | Node 카드 그림자 |
| `--border-node` | none or TBD | Node 카드 보더 |
| `--radius-chip` | pill (`9999px`) | Category/Phase chip |

### 6.4 Spacing Tokens
| Token | Value | Usage |
|---|---|---|
| `--space-node-x` | `12px` | Node 좌/우 패딩 |
| `--space-node-top` | `16px` | Node 상단 패딩 |
| `--space-node-bottom` | `12px` | Node 하단 패딩 |
| `--space-node-gap` | `12px` | Node 내부 블록 간격 |
| `--chip-pad-y` | `6px` | Chip 수직 패딩 |
| `--chip-pad-x` | `8px` | Chip 수평 패딩 |
| `--chip-gap-inner` | `10px` | Chip 내부 gap |

## 7. Component Style Template
| Component | Structure | States | Variant | Notes |
|---|---|---|---|---|
| Input Panel |  | default/disabled/loading |  |  |
| Suggestion Card |  | default/active/hover | category-based |  |
| Chat Dialog |  | open/loading/error |  |  |
| Node Card | `summary + body + chips` | default/highlighted | category + phase | this section is detailed below |

### 7.1 Node Card (Mockup V1 Spec)
#### A. Container
- `display: flex`
- `width: 232px`
- `padding: 16px 12px 12px 12px`
- `flex-direction: column`
- `align-items: flex-start`
- `gap: 12px`
- border: `none` (until otherwise defined)
- background: `--node-bg`
- border-radius: `--radius-node` (TBD from Figma inspect)

#### B. Content Structure
1. Title line:
   - format: `Title(summary) - <summary text>`
   - example: `Title(summary) - Lorem Ipsum is simply dummy text`
   - purpose: 핵심 의미를 한 줄에서 요약
2. Body preview:
   - example: `These keywords are grouped into a sense of speed, energy explosion, ...`
   - 줄 수: 최대 2줄(overflow 시 말줄임)
3. Metadata chip row:
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
| `Where` | `var(--chip-where-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |
| `How` | `var(--chip-how-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |
| `What` | `var(--chip-what-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |
| `Why` | `var(--chip-why-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |
| `Who` | `var(--chip-who-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |
| `Problem` | `var(--chip-problem-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |
| `Solution` | `var(--chip-solution-bg)` (provisional from mockup) | `var(--chip-text, #111111)` |

#### C. Note on Provided Style Snippet
- 제공된 스니펫(`background: var(--Chips-When, #9DBCFF);`)은 색상값 기준으로 `When` chip에 매칭된다.
- 문구상 `Where` 스타일로 전달되었으므로, 토큰 네이밍은 UI-005에서 최종 확정한다.

## 8. Motion and Interaction
- Page transition:
- Panel transition:
- Hover/active behavior:
- Loading behavior:
- Reduced motion policy:

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

## 12. Open Questions
| ID | Question | Owner | Due Date | Status |
|---|---|---|---|---|
| UI-001 | Node card outer radius exact value(및 코너 형태)는? |  |  | Open |
| UI-002 | Title/body typography exact token 값은? |  |  | Open |
| UI-003 | `Solution` chip color token은 무엇으로 확정할지? |  |  | Open |
| UI-004 | Node hover/active state가 목업 범위에 포함되는지? |  |  | Open |
| UI-005 | 전달된 `Where` 스타일의 토큰 이름이 `--Chips-When`인 이유(오타/의도) 확인 필요 |  |  | Open |
