# SnowTrace 專案關係總覽

> 更新日期：2025-12-12
> 目的：清楚說明所有專案間的關係、依賴和整合狀況

## 🏗️ 整體架構圖

```
                    SnowTrace 生態系統
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   核心服務層        資料服務層        應用服務層
        │                │                │
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │User Core│      │Resort   │      │Snowbuddy│
   │(認證中心)│      │Services │      │Matching │
   └─────────┘      │(雪場資料)│      │(智慧媒合)│
        │           └─────────┘      └─────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   前端應用層        獨立應用層        規劃應用層
        │                │                │
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │Ski      │      │單板教學  │      │Tour     │
   │Platform │      │(Next.js)│      │(Next.js)│
   │(React)  │      │獨立部署  │      │行程規劃  │
   └─────────┘      └─────────┘      └─────────┘
```

---

## 📋 專案清單與角色

### 🔧 核心服務層
1. **User Core** - 統一認證與資料中心
   - 角色: 核心依賴，所有服務的基礎
   - 技術: FastAPI + PostgreSQL + Redis
   - 位置: `/platform/user_core/`

### 📊 資料服務層  
2. **Resort Services** - 雪場資料權威來源
   - 角色: 資料提供者，被所有服務依賴
   - 技術: FastAPI + YAML 資料
   - 位置: `/resort_api/`

### 🤝 應用服務層
3. **Snowbuddy Matching** - 智慧雪伴媒合引擎
   - 角色: 業務邏輯服務，媒合算法核心
   - 技術: FastAPI + 多服務整合
   - 位置: `/snowbuddy_matching/`

### 🎨 前端應用層
4. **Ski Platform** - 主前端應用
   - 角色: 使用者界面，整合所有後端服務
   - 技術: React + TypeScript + Redux
   - 位置: `/platform/frontend/ski-platform/`

### 📅 規劃應用層
5. **Tour (Trip Planner)** - 行程規劃器
   - 角色: 獨立微服務，可嵌入主應用
   - 技術: Next.js 15 + Prisma + PostgreSQL
   - 位置: `/tour/`

### 📚 獨立應用層
6. **單板教學** - 教學內容管理系統
   - 角色: 獨立應用，品牌生態一部分
   - 技術: Next.js 15 + Supabase
   - 位置: `/specs/單板教學/`

---

## 🔄 依賴關係矩陣

| 專案 | User Core | Resort Services | Snowbuddy | Tour | Ski Platform | 單板教學 |
|------|-----------|----------------|-----------|------|--------------|----------|
| **User Core** | - | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Resort Services** | ✅ (BehaviorEvent) | - | ❌ | ❌ | ❌ | 🟡 (未來) |
| **Snowbuddy** | ✅ (認證+Calendar) | ✅ (雪場資料) | - | 🟡 (Trip查詢) | ❌ | 🟡 (學習行為) |
| **Tour** | ✅ (認證+Calendar) | ✅ (雪場資料) | 🟡 (雪友推薦) | - | ❌ | ❌ |
| **Ski Platform** | ✅ (認證+資料) | ✅ (雪場展示) | ✅ (媒合UI) | 🟡 (嵌入) | - | 🟡 (連結) |
| **單板教學** | 🟡 (未來SSO) | 🟡 (雪場課程) | 🟡 (學習媒合) | ❌ | 🟡 (品牌) | - |

**圖例**: ✅ 已整合 | 🟡 部分/未來 | ❌ 無依賴

---

## 🌊 資料流向圖

### 1. 使用者認證流程
```
使用者登入 (Ski Platform)
    ↓
User Core 認證服務
    ↓
JWT Token 發放
    ↓
所有服務使用 Token 驗證
```

### 2. Trip 建立與 Calendar 同步
```
使用者建立 Trip (Tour)
    ↓
1. Prisma 儲存 Trip
2. User Core Calendar API (建立事件)
3. Resort Services (獲取雪場資訊)
4. User Core 偏好同步
    ↓
Trip 完整建立
```

### 3. 雪伴媒合與參與流程
```
使用者發起媒合 (Ski Platform)
    ↓
Snowbuddy 媒合算法
    ↓
1. User Core (使用者檔案)
2. Resort Services (雪場資料)  
3. Knowledge Engagement (技能分數)
    ↓
媒合結果返回
    ↓
申請加入 Trip → Calendar 同步
```

### 4. 滑雪足跡紀錄
```
使用者紀錄滑雪 (Ski Platform)
    ↓
Resort Services 足跡 API
    ↓
User Core BehaviorEvent 回寫
    ↓
成就系統更新 (Ski Platform)
```

---

## 🔌 API 整合詳情

### User Core 提供的 API
```
認證服務:
- POST /auth/login
- GET /auth/validate

使用者資料:
- GET /users/{user_id}
- PUT /users/{user_id}/ski-preferences

Calendar 服務:
- POST /calendar/events
- GET /calendar/events
- PUT /calendar/events/{id}
- DELETE /calendar/events/{id}

行為事件:
- POST /behavior-events
```

### Resort Services 提供的 API
```
雪場資料 (公開):
- GET /resorts
- GET /resorts/{resort_id}

滑雪足跡 (需認證):
- POST /users/{user_id}/ski-history
- GET /users/{user_id}/ski-history
```

### Snowbuddy 提供的 API
```
智慧媒合 (需認證):
- POST /searches
- GET /searches/{search_id}

請求管理:
- POST /requests
- PUT /requests/{request_id}

Trip 整合:
- POST /trips/{trip_id}/apply
- PUT /trips/{trip_id}/applications/{request_id}
```

### Tour 提供的 API
```
Trip 管理:
- GET /api/trips
- POST /api/trips
- GET /api/trips/{id}
- PUT /api/trips/{id}
- DELETE /api/trips/{id}

Day/Item 管理:
- CRUD APIs for days and items
```

---

## 🚀 部署架構

### 本地開發環境
```
Docker Compose 統一管理:
- user-core: localhost:8001
- resort-api: localhost:8000  
- snowbuddy-matching: localhost:8002
- ski-platform: localhost:5173 (Vite dev)
- tour: localhost:3010 (Next.js dev)

單板教學: 獨立開發 localhost:3000
```

### 生產環境
```
Zeabur 部署:
- user-core: https://user-core.zeabur.app
- resort-api: https://resort-api.zeabur.app
- snowbuddy-matching: https://snowbuddy.zeabur.app
- ski-platform: https://snowtrace.zeabur.app
- tour: https://tour.zeabur.app

單板教學: https://snowboard-teaching.zeabur.app
```

---

## 📊 整合狀況總結

### ✅ 已完成整合
1. **User Core ↔ 所有服務**: 統一認證架構
2. **Tour ↔ User Core**: Calendar 完整整合
3. **Snowbuddy ↔ User Core**: Calendar + BehaviorEvent
4. **Resort Services ↔ User Core**: 滑雪足跡回寫
5. **Ski Platform ↔ 所有後端**: 完整 UI 整合

### 🟡 部分整合
1. **Tour ↔ Snowbuddy**: Trip 查詢 (Calendar 同步已完成)
2. **Ski Platform ↔ Tour**: 可嵌入但尚未實現
3. **單板教學 ↔ SnowTrace**: 品牌統一，技術整合待定

### 🔮 未來整合規劃
1. **單板教學 SSO**: 與 User Core 認證整合
2. **學習行為同步**: 單板教學 → User Core BehaviorEvent
3. **雪場課程關聯**: 單板教學 ↔ Resort Services
4. **學習夥伴媒合**: 單板教學 ↔ Snowbuddy

---

## 📁 檔案結構對應

```
/Users/jameschen/Downloads/diyski/project/
├── platform/
│   ├── user_core/           # User Core 服務
│   └── frontend/
│       └── ski-platform/    # 主前端應用
├── resort_api/              # Resort Services
├── snowbuddy_matching/      # Snowbuddy Matching  
├── tour/                    # Tour (Trip Planner)
├── specs/
│   └── 單板教學/            # 單板教學系統
├── docs/                    # 文檔目錄
│   ├── *_TODO.md           # 各種 TODO 清單
│   └── *.md                # 技術文檔
└── README.md               # 專案總覽
```

---

## 🎯 關鍵成就

1. **統一認證**: 所有服務共享 User Core 認證
2. **Calendar 整合**: Tour + Snowbuddy 完整 Calendar 同步
3. **智慧媒合**: 5 維度算法 + 跨服務資料整合
4. **微服務架構**: 獨立部署 + API 整合
5. **設計系統**: Glacial Futurism + Alpine Velocity 統一美學

**SnowTrace 已建立完整的滑雪社群生態系統！** 🎿✨
