# 05. Change Log (Future Patches Only)

## Follow-up To-do

## 1. Purpose
- 이 문서는 **앞으로 발생하는 업데이트/패치 내역만 기록**한다.
- 과거 변경사항 백필은 범위에서 제외한다.
- 각 변경사항의 영향 범위, 검증 상태, 롤백 가능성을 추적한다.

## 2. Logging Rules
1. 최신 항목을 상단에 기록한다.
2. `Update`(기능/개선)와 `Patch`(버그/긴급수정)를 구분한다.
3. 최소 필수 필드: 날짜, 작성자, 요약, 영향 범위, 검증, 관련 커밋.
4. 릴리즈에 포함된 항목은 `Release Mapping`에 반영한다.

## 3. Entry Template
```md
### [Update|Patch] YYYY-MM-DD - <Short Title>
- Owner:
- Type: Update | Patch
- Priority: P0 | P1 | P2
- Summary:
- Scope:
  - Frontend:
  - API:
  - AI Logic:
  - Backend (optional):
- Breaking Change: Yes | No
- Verification:
  - Unit:
  - Integration:
  - Manual QA:
- Rollback Plan:
- Related:
  - Ticket:
  - PR:
  - Commit:
  - Spec:
```

## 4. Change Entries
- 현재 기록 없음 (향후 패치부터 기록 시작)

## 5. Release Mapping
| Release Version | Date | Included Entries | Notes |
|---|---|---|---|

