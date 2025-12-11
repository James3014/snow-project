# SnowTrace 前端重構清單

基於 Clean Code、Linus 原則（切小、模組化、解耦、關注點分離）分析

## 重構清單

### P0 - CI 阻塞問題 ✅

- [x] **TODO-001**: 修復 `router/utils.tsx` 類型定義 ✅

### P1 - 核心架構問題 ✅

- [x] **TODO-002**: 拆分 `conversationEngine.ts` (976 行 → 模組化) ✅
- [x] **TODO-003**: 拆分 `SeasonDetail.tsx` (634 行 → ~150 行) ✅
- [x] **TODO-004**: 拆分 `CourseHistory.tsx` (611 行 → ~220 行) ✅
- [x] **TODO-005**: 拆分 `TripDetail.tsx` (535 行 → ~200 行) ✅

### P2 - 代碼品質改善 ✅

- [x] **TODO-006**: 統一 API 錯誤處理 ✅
  - 建立 `shared/utils/apiErrorHandler.ts`

- [x] **TODO-007**: 建立 `useMyGear` hook ✅
  - 從 `MyGear.tsx` 提取數據邏輯

- [x] **TODO-008**: 建立 `useSnowbuddyBoard` hook ✅
  - 從 `SnowbuddyBoard.tsx` 提取數據邏輯

- [ ] **TODO-009**: 整理 AI utils 模組（待後續）
  - `intentParser.ts` (469 行)
  - `ResortIndex.ts` (432 行)
  - `tripFormLogic.ts` (421 行)

### P3 - 優化項目

- [ ] **TODO-010**: 建立 feature 模組 barrel exports
- [ ] **TODO-011**: 統一組件命名規範

---

## 執行記錄

### 2024-12-11

#### P0 完成
- TODO-001: 修復 router/utils.tsx 類型定義 ✅

#### P1 完成
- TODO-002: 拆分 conversationEngine.ts 為 6 個模組 ✅
- TODO-003: 拆分 SeasonDetail.tsx + useSeasonDetail hook ✅
- TODO-004: 拆分 CourseHistory.tsx + useCourseHistory hook ✅
- TODO-005: 拆分 TripDetail.tsx + useTripDetail hook ✅

#### P2 完成
- TODO-006: 建立 apiErrorHandler.ts ✅
- TODO-007: 建立 useMyGear hook ✅
- TODO-008: 建立 useSnowbuddyBoard hook ✅

## 重構成果

| 文件 | 重構前 | 重構後 | 減少 |
|------|--------|--------|------|
| conversationEngine.ts | 976 行 | ~25 行 | 97% |
| SeasonDetail.tsx | 634 行 | ~150 行 | 76% |
| CourseHistory.tsx | 611 行 | ~220 行 | 64% |
| TripDetail.tsx | 535 行 | ~200 行 | 63% |

新增模組化文件：
- `conversation/` 目錄 (6 個文件)
- `hooks/useSeasonDetail.ts`
- `hooks/useCourseHistory.ts`
- `hooks/useTripDetail.ts`
- `hooks/useMyGear.ts`
- `hooks/useSnowbuddyBoard.ts`
- `components/SeasonCalendarView.tsx`
- `components/SeasonResortTripsView.tsx`
- `components/SeasonStatsView.tsx`
- `components/CourseHistoryFilters.tsx`
- `shared/utils/apiErrorHandler.ts`
