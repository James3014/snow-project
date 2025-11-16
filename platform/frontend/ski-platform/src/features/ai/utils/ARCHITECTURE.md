# conversationEngine Architecture Guide

## 設計原則

### 1. tripFormLogic 的邊界規則

**只能包含**：
- 建立一個 Snowbuddy trip card 需要的**最小必要欄位**
- 當前定義：
  - `resort`: ResortMatch - 雪場
  - `startDate`: Date - 開始日期
  - `endDate`: Date - 結束日期（可選）
  - `duration`: number - 天數（可選）
  - `visibility`: 'public' | 'private' - 可見性
  - `maxBuddies`: number - 最多找幾個人（可選）

**不能包含**：
- ❌ 交通資訊（另外設計 TransportForm）
- ❌ 裝備偏好（另外設計 GearPreferenceForm）
- ❌ 住宿資訊（另外設計 AccommodationForm）
- ❌ 課程方案（另外設計 LessonForm）
- ❌ 任何「可以事後補充」的資訊

**判斷標準**：
> 如果沒有這個欄位，用戶能不能「成功發布一個行程 card」？
> - 能 → 不屬於 tripFormLogic，應該另外處理
> - 不能 → 可以加入 tripFormLogic

### 2. 新功能的擴展方式

#### 情境 1: 新增簡單欄位（如：行程標題）
```typescript
// ✅ DO: 加入 TripForm
interface TripForm {
  // ... 現有欄位
  title: FormField<string>;  // 行程標題
}
```

#### 情境 2: 新增複雜功能（如：交通規劃）
```typescript
// ❌ DON'T: 塞進 TripForm
interface TripForm {
  transport: FormField<TransportDetails>;  // ❌ 太複雜
}

// ✅ DO: 另外設計專門的 Form
interface TransportForm {
  departureStation: FormField<Station>;
  arrivalStation: FormField<Station>;
  transportType: FormField<'train' | 'bus' | 'car'>;
}

// 在 conversationEngine 層整合
interface ConversationContext {
  tripForm: TripForm;           // 核心行程
  transportForm: TransportForm; // 交通資訊（可選）
  // ... 其他 forms
}
```

### 3. 狀態推導的原則

**單向數據流**：
```
User Input → Intent → Form Update → State Derivation → Response
```

**狀態應該**：
- ✅ 從數據計算出來（getCurrentState）
- ✅ 可預測、可測試
- ✅ 無副作用

**狀態不應該**：
- ❌ 手動設置（setState）
- ❌ 依賴外部狀態
- ❌ 有隱藏的狀態轉換邏輯

### 4. 向後兼容的策略

**Linus 原則**: "Never break userspace"

當需要重大變更時：
1. 保留舊 API（使用 adapter pattern）
2. 標記為 deprecated
3. 提供遷移指南
4. 至少保留 2-3 個版本
5. 最後才移除

範例：
```typescript
// ✅ 新 API
export function processUserInput(input, context): Promise<Result>

// ✅ 舊 API - 保留但 deprecated
/** @deprecated Use processUserInput instead */
export function handleUserMessage(input, context): Promise<OldResult> {
  const result = await processUserInput(input, context);
  return adaptToOldFormat(result);
}
```

---

## 測試策略

### 測試金字塔

```
         /\
        /E2E\         2-5 個 (真實用戶流程)
       /____\
      /      \
     /Integration\   15-20 個 (跨模組互動)
    /____________\
   /              \
  /   Unit Tests   \  60-80 個 (核心邏輯)
 /__________________\
```

### 必須測試的「怪場景」

1. **中途改主意**：
   - "去苗場" → "3/20" → "啊不對，改 3/22"
   - "3/20 去 5 天" → "其實我只去 3 天"

2. **取消和重來**：
   - 在任何階段說「取消」「重來」「算了」

3. **話題分叉**：
   - 在 CONFIRMING_TRIP 時突然問「推薦裝備」
   - 系統應該：優雅地暫存當前狀態，處理分支話題

4. **無效輸入**：
   - 亂打一通
   - 語言混用（中英日韓）
   - 表情符號

5. **邊界情況**：
   - 今天說「明天」但已經是晚上 11:59
   - 跨年時說「1/5」（今年還是明年？）
   - 雪季結束時還要建行程

---

## 下一步擴展方向

### 階段 7: E2E 真實場景測試
- [ ] 真實 UI 互動測試
- [ ] 「亂操作」場景測試
- [ ] 跨瀏覽器/設備測試

### 階段 8: Command Pattern (conversationEngineV3)
```typescript
type DomainCommand =
  | { type: 'CREATE_TRIP'; payload: TripFormSnapshot }
  | { type: 'UPDATE_TRIP'; tripId: string; payload: Partial<TripFormSnapshot> }
  | { type: 'SHOW_RESORT_LIST' }
  | { type: 'RECOMMEND_GEAR'; criteria: ... }

interface ProcessResult {
  response: ConversationResponse;
  updatedContext: ConversationContext;
  commands: DomainCommand[];  // 新增：要執行的命令
}
```

好處：
- UI 層只需要實現 command executor
- 同一套引擎可以移植到 Line bot、小程式
- 更清楚區分「AI 想做什麼」vs「這個 app 怎麼做」

### 階段 9: 多 Form 整合
```typescript
interface ConversationContext {
  tripForm: TripForm;              // 核心行程
  transportForm?: TransportForm;   // 交通（可選）
  gearForm?: GearPreferenceForm;   // 裝備（可選）
  lessonForm?: LessonForm;         // 課程（可選）
}
```

### 階段 10: 日期/時區/多語言策略
- [ ] 時區處理策略文檔
- [ ] 跨年日期判斷邏輯
- [ ] 多語言混用支持
- [ ] 日文特殊格式（4泊5日等）

---

## 禁止事項

### ❌ 永遠不要做的事

1. **不要把所有東西塞進 tripFormLogic**
   - 每次新增功能前問：這是「必要」還是「方便」？

2. **不要手動管理狀態**
   - 狀態應該從數據推導，不是 setState

3. **不要破壞向後兼容**
   - 除非有非常充分的理由，且提供了遷移路徑

4. **不要跳過測試**
   - 每個 bug 修復都應該先寫測試

5. **不要在生產環境測試新邏輯**
   - 先在測試環境驗證，再灰度發布

---

## 檢查清單

### 新增功能前
- [ ] 這個功能屬於 tripFormLogic 嗎？（檢查邊界規則）
- [ ] 需要新的 Form 嗎？
- [ ] 會破壞向後兼容嗎？
- [ ] 測試計劃準備好了嗎？

### Code Review 時
- [ ] 是否遵循單一職責原則？
- [ ] 是否有足夠的測試覆蓋？
- [ ] 是否有清晰的註釋和文檔？
- [ ] 是否考慮了邊界情況？
- [ ] 是否有性能問題？

### 發布前
- [ ] 所有測試通過
- [ ] TypeScript 編譯無錯誤
- [ ] 文檔已更新
- [ ] 遷移指南已準備（如有破壞性變更）
- [ ] 灰度發布計劃已制定

---

## 參考資料

- [Linus Torvalds on Good Taste](https://www.youtube.com/watch?v=o8NPllzkFhE)
- [The Art of Unix Programming](http://www.catb.org/~esr/writings/taoup/html/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**最後更新**: 2025-11-16
**維護者**: Claude Code
**版本**: 1.0.0
