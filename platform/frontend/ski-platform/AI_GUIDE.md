# Ski Platform Frontend - AI 導讀

## 專案概述
SnowTrace 平台主前端應用，React + TypeScript 實現完整的滑雪社群功能。

## 核心功能
- **AI 對話助手**: 自然語言行程創建 (43 個日本雪場識別)
- **行程規劃**: 完整 CRUD + 雪季管理
- **雪伴系統**: 公佈欄、智慧媒合、申請管理、實時通知
- **裝備管理**: 裝備庫、檢查紀錄、維護提醒、二手市場
- **滑雪足跡**: 成就系統、征服地圖
- **社交動態**: Activity Feed

## 關鍵目錄
```
src/
├── features/
│   ├── ai/                    # AI 對話助手
│   ├── trips/                 # 行程規劃
│   ├── snowbuddy/            # 雪伴系統
│   ├── gear/                 # 裝備管理
│   ├── achievements/         # 成就系統
│   └── map/                  # 征服地圖
├── components/
│   ├── ui/                   # 基礎 UI 組件
│   └── layout/               # 佈局組件
├── services/
│   ├── api/                  # API 客戶端
│   └── auth/                 # 認證服務
├── store/                    # Redux 狀態管理
└── utils/                    # 工具函數
```

## 設計系統
- **Glacial Futurism**: 冰川未來主義美學
- **配色**: 冰藍漸層 (#00d4ff → #0066ff → #7b2cbf)
- **字體**: Orbitron (標題) + Outfit (內文)
- **效果**: 玻璃擬態、發光邊框、懸停動畫

## API 整合
- **User Core**: 認證、使用者資料、行為事件
- **Resort Services**: 雪場資訊、滑雪足跡
- **Snowbuddy Matching**: 智慧媒合、請求管理
- **Trip Planner**: 行程 CRUD (獨立 Next.js 服務)

## 核心組件

### AI 助手
- 自然語言處理
- 雪場智能識別 (別名系統)
- 多輪對話狀態管理
- 意圖識別: CREATE_TRIP, VIEW_TRIPS, DELETE_TRIP

### 雪伴系統
- **公佈欄**: 行程瀏覽、篩選、申請
- **智慧媒合**: 5 維度配對、分數視覺化
- **請求管理**: 收到/發出請求管理
- **實時通知**: 30 秒自動刷新

### 裝備管理
- **裝備庫**: 分類管理 (單板/固定器/雪靴等)
- **檢查系統**: 維護紀錄、狀態追蹤
- **二手市場**: 發布/搜尋/聯繫
- **提醒系統**: 維護到期提醒

## 狀態管理
- Redux Toolkit
- 功能模組化 slice
- 異步 thunk 處理
- 持久化存儲

## 路由結構
```
/                     # 首頁
/trips               # 行程管理
/snowbuddy           # 雪伴公佈欄
/snowbuddy/smart     # 智慧媒合
/snowbuddy/requests  # 媒合請求
/gear                # 裝備管理
/achievements        # 成就系統
/map                 # 征服地圖
```

## 技術棧
- React 18 + TypeScript
- Redux Toolkit (狀態管理)
- React Router v6 (路由)
- Tailwind CSS (樣式)
- Vite (構建工具)
- Axios (HTTP 客戶端)

## 測試
- 21+ 測試套件
- AI 助手核心功能測試
- 組件單元測試

## 最近更新
- 2025-12-02: SnowTrace 品牌重塑
- 2025-11-15: 雪伴功能優化
- 2025-11-11: AI 助手刪除功能
- Glacial Futurism 設計系統完善

## 專案架構與整合
```
Ski Platform (主前端 - React SPA)
    ↓ 整合所有後端服務
┌─────────┬─────────┬─────────┬─────────┐
↓         ↓         ↓         ↓         ↓
User      Resort    Snowbuddy Tour      單板教學
Core      Services  Matching  (Next.js) (獨立)
```

### 服務整合架構
1. **User Core 整合** (核心依賴)
   - 認證管理: 登入/登出/Token 管理
   - 使用者資料: 個人檔案、偏好設定
   - 行為追蹤: 所有使用者操作 → BehaviorEvent

2. **Resort Services 整合**
   - 雪場展示: 首頁雪場卡片
   - 雪場詳情: 點擊查看詳細資訊
   - 滑雪足跡: 紀錄和展示去過的雪場
   - 征服地圖: 視覺化滑雪足跡

3. **Snowbuddy Matching 整合**
   - 智慧媒合: 5 維度配對算法 UI
   - 雪伴公佈欄: Trip 瀏覽和申請
   - 請求管理: 收到/發出的媒合請求
   - 實時通知: 30 秒自動刷新通知

4. **Tour 整合** (微前端)
   - iframe 嵌入: 行程規劃器嵌入主應用
   - 統一認證: 共享 User Core Token
   - 資料同步: Trip 資料與主應用同步

5. **單板教學整合** (外部連結)
   - 獨立應用: 單獨的 Next.js 應用
   - 統一品牌: 相同的設計系統
   - 使用者同步: 可能的 SSO 整合

### 功能模組對應
```
AI 助手 → User Core (認證) + Resort Services (雪場識別)
行程規劃 → Tour (Next.js) + User Core (偏好) + Resort Services (雪場)
雪伴系統 → Snowbuddy (媒合) + User Core (使用者) + Resort Services (地點)
裝備管理 → User Core (Calendar + 使用者資料)
滑雪足跡 → Resort Services (足跡紀錄) + User Core (成就系統)
```

### 狀態管理策略
- **Redux Store**: 集中管理所有服務的資料
- **API Slices**: 每個後端服務對應一個 API slice
- **認證 Slice**: User Core 認證狀態管理
- **UI Slices**: 前端 UI 狀態 (通知、載入等)
