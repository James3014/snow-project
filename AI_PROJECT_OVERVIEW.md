# SnowTrace Platform - AI 專案總覽

## 🎯 平台概述
SnowTrace 是全面性的滑雪運動愛好者平台，採用微服務架構，提供行程規劃、雪伴媒合、裝備管理、滑雪足跡紀錄等功能。

## 🏗️ 架構總覽

### 後端微服務
| 服務 | 狀態 | 主要功能 | Calendar 整合 |
|------|------|----------|---------------|
| **user-core** | ✅ 完成 | 統一認證、使用者管理、Calendar 基礎設施 | ✅ 核心服務 |
| **resort-api** | ✅ 完成 | 43 個日本雪場資訊、滑雪足跡 | ❌ 無需整合 |
| **snowbuddy-matching** | ✅ 完成 | 智慧雪伴媒合、5 維度算法 | 🟡 可加強 |
| **trip-planner (tour)** | ✅ 完成 | Next.js 行程規劃器 | ✅ 完全整合 |

### 前端應用
| 應用 | 狀態 | 技術棧 | 設計系統 |
|------|------|--------|----------|
| **ski-platform** | ✅ 完成 | React + TypeScript | Glacial Futurism |
| **trip-planner** | ✅ 完成 | Next.js 15 | 獨立 UI |
| **resort-services/web** | ✅ 完成 | Next.js 15 | Alpine Velocity |

## 📊 Calendar 整合狀態

### ✅ 完全整合
- **Trip Planning**: 行程 → `EventType.TRIP`
- **Gear Management**: 提醒/維護/交易 → `EventType.GEAR`

### 🟡 部分整合  
- **Snowbuddy Matching**: BehaviorEvent 回寫，可加強媒合成功 → Calendar 事件

### ❌ 無需整合
- **Resort Services**: 純資料服務，無排程需求

## 🔧 技術棧統一

### 後端標準
- **框架**: FastAPI + Pydantic
- **資料庫**: PostgreSQL + SQLAlchemy
- **快取**: Redis
- **認證**: 統一 Bearer Token 系統
- **測試**: pytest + 95% 覆蓋率

### 前端標準
- **框架**: React 18 + TypeScript
- **狀態**: Redux Toolkit
- **樣式**: Tailwind CSS
- **構建**: Vite / Next.js
- **設計**: Glacial Futurism 系統

## 📁 專案結構
```
project/
├── platform/
│   ├── user_core/           # 核心使用者服務 + Calendar
│   └── frontend/ski-platform/  # 主前端應用
├── resort_api/              # 雪場資訊服務
├── snowbuddy_matching/      # 智慧媒合服務
├── tour/                    # 獨立行程規劃器
├── specs/                   # 各服務規格文檔
└── docs/                    # 整合文檔
```

## 🚀 快速啟動

### 後端服務
```bash
docker-compose up --build
# user-core: :8001, resort-api: :8000, snowbuddy: :8002
```

### 前端應用
```bash
# 主前端
cd platform/frontend/ski-platform && npm run dev  # :5173

# 行程規劃器  
cd tour && npm run dev  # :3000

# 雪場展示
cd specs/resort-services/web && npm run dev  # :3001
```

## 📋 AI 導讀文件位置
- `platform/user_core/AI_GUIDE.md` - 核心服務導讀
- `resort_api/AI_GUIDE.md` - 雪場服務導讀  
- `snowbuddy_matching/AI_GUIDE.md` - 媒合服務導讀
- `platform/frontend/ski-platform/AI_GUIDE.md` - 前端導讀
- `tour/AI_GUIDE.md` - 行程規劃器導讀

## 🎯 最新狀態 (2025-12-11)

### 已完成
- ✅ 統一認證架構 (所有服務)
- ✅ Calendar 基礎設施 (user-core)
- ✅ Gear-Calendar 整合擴展功能
- ✅ Snowbuddy 前端完整整合
- ✅ 43 個雪場資料完整性
- ✅ AI 對話助手 (自然語言行程創建)

### 可選優化
- 🟡 Snowbuddy Calendar 整合加強
- 🟡 Coach Scheduling 系統 (規劃階段)
- 🟡 Knowledge Engagement 系統 (規劃階段)

## 📊 統計數據
- **後端測試**: 95+ 個測試，100% 通過
- **前端測試**: 21+ 測試套件
- **API 端點**: 50+ 個 RESTful API
- **雪場資料**: 43 個日本滑雪場
- **代碼行數**: 約 15,000+ 行 (不含依賴)

## 🔗 相關文檔
- [實作總結](./IMPLEMENTATION_SUMMARY.md)
- [認證架構](./docs/AUTHENTICATION.md)  
- [Gear-Calendar 整合](./docs/GEAR_CALENDAR_COMPLETION_SUMMARY.md)
- [Snowbuddy 前端整合](./specs/snowbuddy-matching/INTEGRATION_COMPLETE.md)

---
**最後更新**: 2025-12-11  
**維護者**: SnowTrace Platform Team
