# SnowTrace 前端重構清單

基於 Clean Code、Linus 原則（切小、模組化、解耦、關注點分離）分析

## 項目分析摘要

### 問題發現
1. **大型文件** - 多個頁面組件超過 400 行（違反單一職責）
2. **路由工具類型問題** - `router/utils.tsx` 泛型類型與 CI 環境不兼容
3. **AI 模組過於複雜** - `conversationEngine.ts` 976 行，需拆分
4. **頁面組件職責過重** - 混合 UI、業務邏輯、API 調用

### 優先級評估標準
- P0: 阻塞 CI/部署
- P1: 影響可維護性的核心問題
- P2: 改善代碼品質
- P3: 優化和美化

---

## 重構清單

### P0 - CI 阻塞問題（立即修復）

- [x] **TODO-001**: 修復 `router/utils.tsx` 類型定義
  - 問題：泛型類型與 `verbatimModuleSyntax` 不兼容
  - 方案：簡化為基礎類型，避免複雜泛型
  - 狀態：✅ 完成

### P1 - 核心架構問題

- [ ] **TODO-002**: 拆分 `conversationEngine.ts` (976 行)
  - 目標：< 200 行/文件
  - 拆分方案：
    - `conversationState.ts` - 狀態管理
    - `messageProcessor.ts` - 訊息處理
    - `responseGenerator.ts` - 回應生成
    - `conversationEngine.ts` - 主入口（組合）

- [ ] **TODO-003**: 拆分 `SeasonDetail.tsx` (634 行)
  - 拆分方案：
    - `useSeasonDetail.ts` - 自定義 hook（數據邏輯）
    - `SeasonHeader.tsx` - 頭部組件
    - `SeasonTripList.tsx` - 行程列表
    - `SeasonStats.tsx` - 統計組件

- [ ] **TODO-004**: 拆分 `CourseHistory.tsx` (611 行)
  - 拆分方案：
    - `useCourseHistory.ts` - 自定義 hook
    - `HistoryFilters.tsx` - 篩選組件
    - `HistoryList.tsx` - 列表組件
    - `HistoryStats.tsx` - 統計組件

- [ ] **TODO-005**: 拆分 `TripDetail.tsx` (535 行)
  - 拆分方案：
    - `useTripDetail.ts` - 自定義 hook
    - `TripHeader.tsx` - 頭部資訊
    - `TripBuddySection.tsx` - 雪伴區塊
    - `TripActions.tsx` - 操作按鈕

### P2 - 代碼品質改善

- [ ] **TODO-006**: 統一 API 錯誤處理
  - 建立 `shared/utils/apiErrorHandler.ts`
  - 統一錯誤格式和用戶提示

- [ ] **TODO-007**: 拆分 `MyGear.tsx` (446 行)
  - 拆分為 hooks + 子組件

- [ ] **TODO-008**: 拆分 `SnowbuddyBoard.tsx` (436 行)
  - 拆分為 hooks + 子組件

- [ ] **TODO-009**: 整理 AI utils 模組
  - `intentParser.ts` (469 行) 拆分
  - `ResortIndex.ts` (432 行) 拆分
  - `tripFormLogic.ts` (421 行) 拆分

### P3 - 優化項目

- [ ] **TODO-010**: 建立 feature 模組 barrel exports
  - 每個 feature 建立 `index.ts` 統一導出

- [ ] **TODO-011**: 統一組件命名規範
  - Page 後綴用於頁面組件
  - Modal 後綴用於彈窗組件

---

## 執行記錄

### 2024-12-11

#### TODO-001: 修復 router/utils.tsx ✅
- 簡化類型定義，使用 `React.lazy` 原生類型
- 移除複雜泛型，改用簡單函數簽名
