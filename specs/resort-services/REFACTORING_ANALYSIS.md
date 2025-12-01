# Resort Services - Clean Code 重構分析報告

**分析時間:** 2025-12-02  
**分析原則:** Clean Code + Linus Torvalds 原則

---

## 📊 項目概況

### 項目結構
```
resort-services/
├── web/                    # Next.js 前端 (已實作)
│   └── src/
│       ├── app/           # 頁面
│       │   ├── page.tsx   # 主頁 (~120 行)
│       │   ├── layout.tsx
│       │   └── globals.css
│       └── components/    # 組件
│           ├── ResortCard.tsx (~120 行)
│           ├── FilterBar.tsx (~50 行)
│           └── SearchBar.tsx (~40 行)
├── data/                   # YAML 雪場數據
│   ├── hokkaido/
│   ├── nagano/
│   ├── niigata/
│   └── ...
└── (後端尚未實作)
```

### 代碼規模
- **前端 (Next.js)**: ~330 行 TypeScript
- **數據文件**: 30+ 個 YAML 文件
- **後端 (FastAPI)**: 尚未實作

---

## 🔍 Clean Code 違規分析

### 1. **關注點分離 (Separation of Concerns)** ⚠️⚠️

#### 問題：page.tsx 混雜多重職責
```typescript
// page.tsx 同時處理：
1. Mock 數據定義 (應該在 API 或 data 層)
2. 狀態管理 (search, selectedRegion, snowMode)
3. 過濾邏輯 (filteredResorts)
4. UI 渲染 (header, main, footer)
```

**違反原則**: Single Responsibility Principle (SRP)

---

### 2. **數據與視圖耦合 (Data-View Coupling)** ⚠️⚠️⚠️

#### 問題：硬編碼 Mock 數據
```typescript
// page.tsx
const MOCK_RESORTS = [
  { id: 'yuzawa_kagura', name: '神樂滑雪場', ... },
  // ... 更多硬編碼數據
];
```

**違反原則**: 數據應該從 API 獲取，而非硬編碼

---

### 3. **類型定義分散 (Scattered Type Definitions)** ⚠️

#### 問題：Resort 類型在多處重複定義
```typescript
// ResortCard.tsx
interface Resort {
  id: string;
  name: string;
  // ...
}

// page.tsx 中的 MOCK_RESORTS 隱含相同結構
```

**違反原則**: DRY (Don't Repeat Yourself)

---

### 4. **魔術字符串 (Magic Strings)** ⚠️

#### 問題：硬編碼的設施標籤
```typescript
// ResortCard.tsx
const AMENITY_LABELS: Record<string, string> = {
  night_ski: '夜滑',
  onsen: '溫泉',
  // ...
};
```

**建議**: 應該集中管理常量

---

### 5. **缺少 API 層 (Missing API Layer)** ⚠️⚠️⚠️

#### 問題：後端 API 尚未實作
- tasks.md 列出了完整的後端任務
- 前端使用 Mock 數據
- 無法與其他服務整合

**違反原則**: 前後端分離

---

### 6. **缺少錯誤處理 (Missing Error Handling)** ⚠️

#### 問題：無錯誤邊界和加載狀態
```typescript
// page.tsx
// 沒有 loading 狀態
// 沒有 error 處理
// 沒有 Suspense 邊界
```

**違反原則**: 健壯性

---

### 7. **組件可重用性 (Component Reusability)** ⚠️

#### 問題：FilterBar 硬編碼地區列表
```typescript
// FilterBar.tsx
const REGIONS = [
  { id: 'niigata', name: '新潟縣' },
  // ... 硬編碼
];
```

**建議**: 地區列表應該從 API 獲取或作為 props 傳入

---

## 🎯 Linus Torvalds 原則分析

### 1. **"Good taste in code"** ⚠️

#### 優點：
- 組件結構清晰
- TypeScript 類型使用良好
- Tailwind CSS 樣式組織合理

#### 問題：
- 過多的內聯樣式
- 缺少樣式抽象

---

### 2. **"Small, focused changes"** ✅

#### 優點：
- 組件相對小巧
- 每個組件職責相對單一

---

### 3. **"Make it obvious"** ⚠️

#### 問題：
- Mock 數據的存在不明顯
- 缺少註釋說明臨時實作

---

## 📋 重構優先級清單

### 🔴 高優先級 (架構和功能)

1. **實作後端 API 服務**
   - 創建 FastAPI 項目結構
   - 實作數據加載層
   - 實作 API 端點

2. **創建共享類型定義**
   - 統一 Resort 類型
   - 創建 types/ 目錄

3. **實作 API 客戶端**
   - 創建 api/ 目錄
   - 實作數據獲取 hooks

4. **分離數據和視圖**
   - 移除 Mock 數據
   - 使用 API 獲取數據

### 🟡 中優先級 (代碼質量)

5. **添加錯誤處理**
   - 加載狀態
   - 錯誤邊界
   - 空狀態

6. **提取常量**
   - 創建 constants/ 目錄
   - 集中管理魔術字符串

7. **改善組件結構**
   - 提取 Header 組件
   - 提取 ResortList 組件

8. **添加狀態管理**
   - 使用 React Context 或 Zustand
   - 管理全局狀態

### 🟢 低優先級 (優化)

9. **樣式優化**
   - 提取共用樣式
   - 創建設計系統組件

10. **性能優化**
    - 圖片懶加載
    - 虛擬列表

11. **測試**
    - 組件測試
    - API 測試

12. **文檔**
    - API 文檔
    - 組件文檔

---

## 📊 預期收益

### 可維護性
- ✅ 類型統一，減少錯誤
- ✅ 關注點分離，易於修改
- ✅ 代碼可讀性提升

### 可擴展性
- ✅ API 層支持未來功能
- ✅ 組件可重用
- ✅ 支持多語言

### 可測試性
- ✅ 數據和視圖分離
- ✅ 純函數易於測試
- ✅ Mock 數據可控

---

## 🎯 建議執行順序

由於後端尚未實作，建議：

1. **先完成後端 API** (Epic 1-3 from tasks.md)
2. **再重構前端** (連接真實 API)
3. **最後優化** (樣式、性能、測試)

---

**分析完成** ✅
