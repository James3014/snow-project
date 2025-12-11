# SnowTrace 前端重構清單

基於 Clean Code、Linus 原則（切小、模組化、解耦、關注點分離）分析

## 重構清單

### P0 - CI 阻塞問題 ✅

- [x] **TODO-001**: 修復 `router/utils.tsx` 類型定義
  - 簡化為基礎類型，避免複雜泛型
  - 狀態：✅ 完成

### P1 - 核心架構問題 ✅

- [x] **TODO-002**: 拆分 `conversationEngine.ts` (976 行 → 模組化)
  - 建立 `conversation/` 目錄
  - `types.ts` - 類型定義
  - `constants.ts` - 常量
  - `utils.ts` - 工具函數
  - `responses.ts` - 回應生成器
  - `handlers.ts` - 處理器
  - `index.ts` - 主入口
  - 狀態：✅ 完成

- [x] **TODO-003**: 拆分 `SeasonDetail.tsx` (634 行 → ~150 行)
  - `useSeasonDetail.ts` - 自定義 hook
  - `SeasonCalendarView.tsx` - 日曆視圖組件
  - `SeasonResortTripsView.tsx` - 雪場行程組件
  - `SeasonStatsView.tsx` - 統計組件
  - 狀態：✅ 完成

- [x] **TODO-004**: 拆分 `CourseHistory.tsx` (611 行 → ~220 行)
  - `useCourseHistory.ts` - 自定義 hook
  - `CourseHistoryFilters.tsx` - 篩選組件
  - 狀態：✅ 完成

- [x] **TODO-005**: 拆分 `TripDetail.tsx` (535 行 → ~200 行)
  - `useTripDetail.ts` - 自定義 hook
  - 狀態：✅ 完成

### P2 - 代碼品質改善

- [ ] **TODO-006**: 統一 API 錯誤處理
  - 建立 `shared/utils/apiErrorHandler.ts`

- [ ] **TODO-007**: 拆分 `MyGear.tsx` (446 行)

- [ ] **TODO-008**: 拆分 `SnowbuddyBoard.tsx` (436 行)

- [ ] **TODO-009**: 整理 AI utils 模組
  - `intentParser.ts` (469 行)
  - `ResortIndex.ts` (432 行)
  - `tripFormLogic.ts` (421 行)

### P3 - 優化項目

- [ ] **TODO-010**: 建立 feature 模組 barrel exports

- [ ] **TODO-011**: 統一組件命名規範

---

## 執行記錄

### 2024-12-11

#### TODO-001: 修復 router/utils.tsx ✅
- 簡化類型定義，使用 `React.ComponentType` 和 `React.LazyExoticComponent`

#### TODO-002: 拆分 conversationEngine.ts ✅
- 建立 `src/features/ai/utils/conversation/` 目錄
- 拆分為 6 個模組文件

#### TODO-003: 拆分 SeasonDetail.tsx ✅
- 建立 `useSeasonDetail` hook
- 建立 3 個子組件

#### TODO-004: 拆分 CourseHistory.tsx ✅
- 建立 `useCourseHistory` hook
- 建立 `CourseHistoryFilters` 組件

#### TODO-005: 拆分 TripDetail.tsx ✅
- 建立 `useTripDetail` hook

## 重構成果

| 文件 | 重構前 | 重構後 | 減少 |
|------|--------|--------|------|
| conversationEngine.ts | 976 行 | ~25 行 (重導出) | 97% |
| SeasonDetail.tsx | 634 行 | ~150 行 | 76% |
| CourseHistory.tsx | 611 行 | ~220 行 | 64% |
| TripDetail.tsx | 535 行 | ~200 行 | 63% |

新增模組化文件：
- `conversation/types.ts`
- `conversation/constants.ts`
- `conversation/utils.ts`
- `conversation/responses.ts`
- `conversation/handlers.ts`
- `conversation/index.ts`
- `hooks/useSeasonDetail.ts`
- `hooks/useCourseHistory.ts`
- `hooks/useTripDetail.ts`
- `components/SeasonCalendarView.tsx`
- `components/SeasonResortTripsView.tsx`
- `components/SeasonStatsView.tsx`
- `components/CourseHistoryFilters.tsx`
