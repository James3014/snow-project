# 按鈕動作處理說明

## 概述

所有按鈕現在都**直接觸發對應動作**，不再繞道文字解析，提高可靠性和響應速度。

## 按鈕列表

### 1. CREATE_TRIP - 建立行程
- **位置**: 主選單、錯誤恢復
- **功能**: 開始建立行程流程
- **實現**: 添加用戶消息 → 觸發意圖解析 → 進入建立流程

### 2. VIEW_TRIPS - 查看行程
- **位置**: 主選單、行程建立成功後
- **功能**: 直接導航到行程列表頁面
- **實現**: 添加消息 → **直接調用 handleViewTrips()** → 1秒後導航到 /trips
- **優化**: 不經過意圖解析，直接執行

### 3. MAIN_MENU - 返回主選單
- **位置**: 行程建立成功後
- **功能**: 重置對話狀態，返回主選單
- **實現**: 添加消息 → 調用 resetToMenu() → 清空 tripData

### 4. RESTART - 重新開始
- **位置**: 等待雪場、等待日期狀態
- **功能**: 重置建立行程流程
- **實現**: 添加消息 → 調用 resetToMenu() → 提示輸入雪場

### 5. CANCEL - 取消
- **位置**: 刪除行程確認、確認行程時
- **功能**: 取消當前操作，返回主選單
- **實現**: 添加消息 → 調用 resetToMenu()

### 6. CONFIRM - 確定建立
- **位置**: 確認行程資訊時
- **功能**: 確認建立行程
- **實現**: 添加消息「確定」→ 觸發意圖解析 → 處理確認邏輯

### 7. CONFIRM_DELETE - 確認刪除
- **位置**: 刪除行程確認對話
- **功能**: 確認刪除指定行程
- **實現**: 添加消息「確定」→ 觸發意圖解析 → 執行刪除操作

## 改進前後對比

### 改進前（有風險）
```typescript
// 所有按鈕都當作文字輸入
handleUserInput(clickedButton.label);
// ❌ 問題：
// 1. 依賴意圖解析，可能失敗
// 2. 增加不必要的處理步驟
// 3. 如果關鍵詞配置錯誤，按鈕就失效
```

### 改進後（可靠）
```typescript
switch (action) {
  case 'VIEW_TRIPS':
    // ✅ 直接執行動作，不依賴意圖解析
    addMessage('user', '查看行程');
    addMessage('assistant', '正在為你打開行程列表...');
    handleViewTrips();
    break;

  case 'CREATE_TRIP':
    // ✅ 明確觸發建立流程
    addMessage('user', '建立行程');
    await handleUserInput('建立行程');
    break;
}
```

## 實現細節

### ChatDialog.tsx:78-137
```typescript
const handleButtonClick = async (action: string) => {
  const clickedButton = buttons.find(b => b.action === action);
  if (!clickedButton) return;

  // 根據 action 直接觸發對應功能
  switch (action) {
    case 'VIEW_TRIPS':
      // 直接導航，不經過意圖解析
      addMessage('user', '查看行程');
      addMessage('assistant', '正在為你打開行程列表...');
      handleViewTrips();
      break;

    // ... 其他 cases
  }
};
```

### QuickButtons.tsx:10
```typescript
interface QuickButtonsProps {
  buttons: ButtonOption[];
  onButtonClick: (action: string) => void | Promise<void>;  // ✅ 支持 async
}
```

## 優點

1. **可靠性** ✅
   - 按鈕功能不依賴意圖解析關鍵詞
   - 即使 intentParser 出問題，按鈕仍然可用

2. **性能** ⚡
   - VIEW_TRIPS 直接導航，省略意圖解析步驟
   - 減少不必要的 async 操作

3. **可維護性** 🛠
   - 按鈕行為集中在一處，易於理解和修改
   - 清晰的 switch-case 結構

4. **用戶體驗** 😊
   - 按鈕響應更快
   - 行為更可預測

## 測試建議

1. **主選單按鈕**
   - 點擊「建立行程」→ 應該進入建立流程
   - 點擊「查看行程」→ 應該直接導航到 /trips

2. **流程中按鈕**
   - 點擊「重新開始」→ 應該清空狀態，重新詢問雪場
   - 點擊「取消」→ 應該返回主選單

3. **確認按鈕**
   - 點擊「確定建立」→ 應該執行建立行程
   - 點擊「確認刪除」→ 應該執行刪除操作

4. **邊界情況**
   - 快速連續點擊按鈕 → 應該有適當的處理（isProcessing 狀態）
   - 未知 action → 應該降級為文字輸入並紀錄警告
