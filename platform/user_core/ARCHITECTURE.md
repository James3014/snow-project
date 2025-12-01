# User Core - 架構文檔

## 概述

User Core 是 SkiDIY 平台的核心用戶服務，負責管理用戶資料、行為事件、課程追蹤、社交功能和行程規劃。

## 目錄結構

```
user_core/
├── api/                    # API 端點層
│   ├── main.py            # 應用入口點
│   ├── auth.py            # 認證端點
│   ├── user_profiles.py   # 用戶資料端點
│   ├── course_tracking.py # 課程追蹤端點
│   ├── social.py          # 社交功能端點
│   └── trip_planning.py   # 行程規劃端點
│
├── config/                 # 配置模組
│   ├── settings.py        # 應用設定
│   ├── cors.py            # CORS 配置
│   ├── router.py          # 路由註冊
│   ├── database.py        # 數據庫初始化
│   └── startup.py         # 啟動事件
│
├── services/               # 業務邏輯層
│   ├── course_tracking_service.py  # 課程追蹤 (facade)
│   ├── course_visit_service.py     # 課程訪問
│   ├── achievement_service.py      # 成就系統
│   ├── recommendation_service.py   # 推薦系統
│   ├── leaderboard_service.py      # 排行榜
│   ├── social_service.py           # 社交功能
│   └── trip_planning_service.py    # 行程規劃
│
├── models/                 # 數據模型層 (SQLAlchemy)
│   ├── user_profile.py
│   ├── course_tracking.py
│   ├── social.py
│   └── trip_planning.py
│
├── schemas/                # Pydantic schemas
│   ├── user_profile.py
│   ├── course_tracking.py
│   └── trip_planning.py
│
├── exceptions/             # 異常處理
│   ├── base.py            # 基礎異常
│   ├── domain.py          # 業務異常
│   └── handlers.py        # 異常處理器
│
├── utils/                  # 工具函式
│   ├── user_utils.py      # 用戶工具
│   └── pagination.py      # 分頁工具
│
├── logging/                # 日誌配置
│   ├── config.py          # 日誌設定
│   └── middleware.py      # 日誌中間件
│
└── alembic/                # 數據庫遷移
```

## 分層架構

```
┌─────────────────────────────────────────┐
│              API Layer                   │
│  (FastAPI routers, request handling)     │
├─────────────────────────────────────────┤
│            Service Layer                 │
│  (Business logic, orchestration)         │
├─────────────────────────────────────────┤
│            Model Layer                   │
│  (SQLAlchemy models, data access)        │
├─────────────────────────────────────────┤
│           Database Layer                 │
│  (PostgreSQL / SQLite)                   │
└─────────────────────────────────────────┘
```

## 核心模組

### 1. 用戶管理
- 用戶資料 CRUD
- 偏好設定
- 認證授權

### 2. 課程追蹤
- 課程訪問記錄
- 進度計算
- 推薦系統
- 成就系統
- 排行榜

### 3. 社交功能
- 好友系統
- 動態牆
- 分享卡片

### 4. 行程規劃
- 季節管理
- 行程 CRUD
- 雪伴媒合

## 設計原則

1. **單一職責** - 每個模組只負責一個功能
2. **關注點分離** - API、業務邏輯、數據訪問分離
3. **向後兼容** - 使用 facade 模式保持 API 穩定
4. **統一錯誤處理** - 全局異常處理器
5. **配置外部化** - 環境變數配置

## 依賴關係

```
api → services → models
         ↓
      schemas
         ↓
    exceptions
```

## 擴展指南

### 添加新功能
1. 在 `models/` 創建數據模型
2. 在 `schemas/` 創建 Pydantic schemas
3. 在 `services/` 創建業務邏輯
4. 在 `api/` 創建 API 端點
5. 在 `config/router.py` 註冊路由

### 添加新異常
1. 在 `exceptions/domain.py` 定義異常類
2. 在 `exceptions/__init__.py` 導出
3. 在服務層使用

## 測試策略

- **單元測試**: 測試服務層邏輯
- **集成測試**: 測試 API 端點
- **契約測試**: 測試 API 契約
