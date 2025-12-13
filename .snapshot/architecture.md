# SnowTrace 系統架構

## 🏗️ 整體架構圖
```
                    User Core (核心服務)
                         ↑
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
   Ski Platform    Tour (Trip Planner)  Snowbuddy
   (主前端)         (行程規劃)           (雪伴媒合)
        ↓                ↓                ↓
        └────────────────┼────────────────┘
                         ↓
                  Resort Services
                   (雪場資料)
```

## 🔧 微服務架構
### User Core (核心服務)
- **職責**: 統一認證、使用者資料、行為事件、Calendar 基礎設施
- **技術**: Python + FastAPI + PostgreSQL + Redis
- **端點**: https://user-core.zeabur.app
- **關鍵功能**:
  - 統一認證 API (`/auth/login`, `/auth/validate`)
  - 使用者管理 CRUD
  - BehaviorEvent 跨服務事件紀錄
  - Calendar Service (EventType: TRIP, GEAR, MATCHING)

### Resort Services (雪場服務)
- **職責**: 43個日本雪場資訊管理
- **技術**: Python + FastAPI + PostgreSQL
- **端點**: https://resort-api.zeabur.app
- **關鍵功能**:
  - 雪場資訊查詢 (公開端點)
  - 滑雪足跡紀錄 (需認證)
  - 分頁查詢支援

### Snowbuddy Matching (雪伴媒合)
- **職責**: 智慧雪伴匹配引擎
- **技術**: Python + FastAPI + PostgreSQL
- **端點**: https://snowbuddy-matching.zeabur.app
- **關鍵功能**:
  - 多維度匹配算法 (技能、地點、時間、角色、知識)
  - 非同步雪伴搜尋
  - 雪伴邀請和接受流程

### Tour (行程規劃)
- **職責**: Trip/Day/Item/Checklist/Packing 生命週期管理
- **技術**: Next.js 15 + Prisma + PostgreSQL
- **部署**: 準備中
- **關鍵功能**:
  - Trip CRUD API
  - Calendar Service 整合
  - 偏好同步到 user-core

## 🎨 前端架構
### Ski Platform (主前端)
- **技術**: React 18 + TypeScript + Redux Toolkit + Tailwind CSS
- **端點**: https://ski-platform.zeabur.app
- **功能模組**:
  - 認證系統
  - 行程規劃 (AI 對話助手)
  - 雪伴媒合
  - 裝備管理
  - 成就系統
  - 社交動態
  - 滑雪地圖

### Tour Frontend (行程規劃器)
- **技術**: Next.js 15 + Tailwind CSS
- **狀態**: 開發完成，準備部署
- **特色**: 模板化 Trip 建立、即時樂觀更新

## 🔐 認證架構
### 統一認證系統
```
所有服務 → User Core Auth API
├── Bearer Token 認證
├── X-User-Id 標頭支援
├── 環境感知安全機制
└── 開發/生產模式切換
```

### 認證流程
1. 前端 → User Core `/auth/login`
2. 取得 JWT Token
3. 其他服務 → User Core `/auth/validate`
4. 驗證成功後提供服務

## 📊 資料架構
### User Core 資料庫
```sql
-- 核心表
user_profiles          # 使用者資料
behavior_events        # 行為事件
calendar_events        # 行事曆事件
trips                  # 行程資料
gear_items            # 裝備資料
```

### Resort Services 資料庫
```sql
resorts               # 雪場資料 (43個)
course_visits         # 滑雪足跡
```

### Snowbuddy Matching 資料庫
```sql
matching_searches     # 媒合搜尋
match_results        # 媒合結果
```

## 🔄 資料流向
### 行程建立流程
1. 前端 → User Core 建立 Trip
2. User Core → Calendar Service 建立事件
3. User Core → Resort Services 同步偏好
4. 前端更新 UI

### 雪伴媒合流程
1. 前端 → Snowbuddy 發起搜尋
2. Snowbuddy → User Core 取得使用者資料
3. Snowbuddy 執行匹配算法
4. 媒合成功 → Calendar Service 建立約定事件

## 🚀 部署架構
### Zeabur 雲端部署
```
GitHub Repository
       ↓ (自動部署)
   Zeabur Platform
       ↓
各服務容器 (Docker)
       ↓
PostgreSQL 資料庫
```

### 環境配置
- **開發環境**: 本地 Docker Compose
- **生產環境**: Zeabur 雲端服務
- **CI/CD**: GitHub Actions → Zeabur

## 📈 擴展性設計
### 水平擴展
- 微服務獨立擴展
- 資料庫讀寫分離準備
- Redis 快取層

### 垂直整合
- 統一 Calendar 基礎設施
- 共享認證系統
- 跨服務事件追蹤

## 🔍 監控架構
### 應用監控
- Health Check 端點
- 錯誤追蹤 (Sentry 可選)
- 性能指標收集

### 基礎設施監控
- Zeabur 平台監控
- 資料庫性能監控
- API 回應時間追蹤
