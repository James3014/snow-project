# Gear Operations 重構指南

## Linus 原則：簡單、直接、可運作

本文件說明如何按照 **Linus 原則**進行程式碼重構，避免過度設計。

---

## 核心原則

### 1. 簡單直接
- ❌ 不要過度抽象
- ❌ 不要過早優化
- ✅ 先讓它能跑
- ✅ 有問題再重構

### 2. 移除複雜度
- ❌ 不必要的 useCallback
- ❌ 不必要的 useRef
- ❌ 複雜的依賴鏈
- ✅ 單一職責函數
- ✅ 清晰的資料流

### 3. 實用至上
- ❌ 炫技式的程式碼
- ❌ "未來可能用到"的功能
- ✅ 解決當前問題
- ✅ 可讀性優先

---

## React 重構檢查清單

### useEffect 無限循環檢查

**症狀**：React Error #310 或頁面持續重新渲染

**檢查項目**：
```tsx
// ❌ 錯誤：複雜的依賴鏈
useEffect(() => {
  loadData();
}, [loadData, userId, filter]); // loadData 每次都變

// ❌ 錯誤：過度優化
const loadData = useCallback(() => {
  // ...
}, [userId, filter, someOtherDep]); // 依賴太多

// ✅ 正確：簡單直接
useEffect(() => {
  let cancelled = false;

  async function load() {
    // ... 載入邏輯
    if (!cancelled) {
      setData(result);
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, []); // 只執行一次
```

**重構步驟**：
1. ✅ 移除所有 useCallback（除非真的需要）
2. ✅ 移除所有 useRef（除非真的需要）
3. ✅ 使用 `cancelled` flag 處理清理
4. ✅ 依賴陣列保持簡單（最好是 `[]`）

### State 管理簡化

```tsx
// ❌ 錯誤：太多 state 相互影響
const [weekOffset, setWeekOffset] = useState(0);
const [autoSelect, setAutoSelect] = useState(true);
const [lastUpdate, setLastUpdate] = useState(Date.now());

useEffect(() => {
  if (autoSelect) {
    setWeekOffset(calculateOffset());
  }
}, [autoSelect, lastUpdate]); // 複雜依賴

// ✅ 正確：簡單的 state
const [monthOffset, setMonthOffset] = useState(0);
// 就這樣，沒有自動選擇邏輯
```

**重構步驟**：
1. ✅ 移除"聰明"的自動化邏輯
2. ✅ 讓使用者明確選擇
3. ✅ 減少 state 之間的相互影響

---

## API 重構檢查清單

### CORS 設定

**檢查項目**：
```python
# ✅ main.py 必須有 CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發環境
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 環境變數配置

**檢查項目**：
```json
// ✅ zeabur.json 必須設定所有環境變數
{
  "env": {
    "VITE_GEAR_API_URL": {
      "default": "https://gear-api.zeabur.app"
    }
  }
}
```

```python
# ✅ config.py 必須有預設值
class Settings(BaseSettings):
    gear_db_url: str = os.environ.get('GEAR_DB_URL', 'postgresql://...')
```

---

## 部署檢查清單

### 前端部署 (ski-platform)

- [ ] 環境變數已設定在 `zeabur.json`
- [ ] 所有 API URL 指向正確的後端
- [ ] 繁體中文轉換完成
- [ ] 測試所有功能正常

### 後端部署 (gear-api)

- [ ] `zeabur.json` 已創建
- [ ] 啟動命令正確：`uvicorn api.main:app --host 0.0.0.0 --port 8002`
- [ ] CORS 已設定
- [ ] 資料庫連接已配置
- [ ] JWT_SECRET 已設定

---

## 常見錯誤修復

### Error #310: useEffect 無限循環

**修復方法**：
1. 找出所有 `useEffect`
2. 檢查依賴陣列
3. 移除不必要的 useCallback/useRef
4. 簡化為單一 useEffect with `[]`

### CORS 錯誤

**修復方法**：
1. 檢查後端 `main.py` 是否有 CORS middleware
2. 確認後端服務已部署且正在運行
3. 確認 URL 配置正確（前端和後端一致）

### 404 錯誤

**修復方法**：
1. 確認後端服務已部署
2. 檢查 API 路徑是否正確（/api/gear/items）
3. 確認環境變數 URL 正確

---

## 重構實例

### 案例 1：SnowbuddyBoard 週改月

**問題**：週篩選太細，用戶體驗不佳

**解決方案**：
```tsx
// Before: 9 個週選項
const weekOptions = Array.from({ length: 9 }, ...);

// After: 6 個月選項（更直觀）
const monthOptions = Array.from({ length: 6 }, (_, i) => ({
  offset: i,
  label: i === 0 ? '本月' : i === 1 ? '下月' : `${i}個月後`,
  monthLabel: formatMonthLabel(i)
}));
```

**重構步驟**：
1. ✅ 修改 state 名稱（weekOffset → monthOffset）
2. ✅ 修改計算邏輯（getWeekRange → getMonthRange）
3. ✅ 更新 UI 文字（週 → 月）
4. ✅ 簡化選項數量（9 → 6）

### 案例 2：移除多餘的 useEffect

**問題**：過濾條件改變時重置分頁

**原始碼**（過度優化）：
```tsx
useEffect(() => {
  setItemsToShow(12);
}, [selectedMonthOffset, statusFilter, resortFilter]);
```

**解決方案**（Linus 原則）：
```tsx
// 直接移除這個 useEffect
// 使用者可以自己點"載入更多"
```

**原因**：
- 這是"聰明"的優化，但會造成額外的重新渲染
- 使用者改變篩選條件時，看到完整列表反而更好
- 如果真的需要重置，使用者會自己重新整理頁面

---

## 開發者指南

### 遇到 Bug 時

1. **不要立刻重構** - 先找出根本原因
2. **最小改動原則** - 只修改必要的部分
3. **移除複雜度** - 如果程式碼太複雜，簡化它
4. **測試驗證** - 確認修復有效

### 新增功能時

1. **先寫最簡單的版本** - 能跑就好
2. **測試是否滿足需求** - 使用者回饋優先
3. **必要時再優化** - 不要過早優化
4. **保持程式碼可讀** - 其他人要能看懂

### Code Review 檢查項目

- [ ] 程式碼是否簡單直接？
- [ ] 是否有不必要的抽象？
- [ ] 是否有過早的優化？
- [ ] 錯誤處理是否完整？
- [ ] 是否有足夠的註解？

---

## 參考資源

### Linus Torvalds 名言

> "Talk is cheap. Show me the code."
> （廢話少說，給我看程式碼）

> "Bad programmers worry about the code. Good programmers worry about data structures and their relationships."
> （爛程式設計師擔心程式碼，好的程式設計師擔心資料結構和它們的關係）

### 推薦閱讀

- [The Zen of Python](https://peps.python.org/pep-0020/) - Simple is better than complex
- [KISS Principle](https://en.wikipedia.org/wiki/KISS_principle) - Keep It Simple, Stupid
- [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it) - You Aren't Gonna Need It

---

## 結論

記住 **Linus 原則**：

1. **簡單直接** - 不要過度設計
2. **先讓它能跑** - 完美是優化的敵人
3. **有問題再改** - 不要過早優化
4. **可讀性優先** - 程式碼是給人看的

**如果程式碼太複雜，你可能做錯了。**

---

最後更新：2025-11-14
