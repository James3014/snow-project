# Snowbuddy Matching 架構說明

## 目錄結構

```
snowbuddy_matching/
├── app/
│   ├── __init__.py
│   ├── main.py              # 應用程式入口點
│   ├── config.py            # 集中配置管理
│   ├── exceptions.py        # 自定義例外與全域處理器
│   ├── auth_utils.py        # 認證工具
│   ├── routers/             # API 路由模組
│   │   ├── search_router.py # 搜尋相關端點
│   │   ├── requests_router.py# 配對請求端點
│   │   └── health_router.py # 健康檢查端點
│   ├── services/            # 業務邏輯層
│   │   ├── matching_service.py # 配對流程協調
│   │   └── redis_repository.py # Redis 資料存取
│   ├── core/                # 演算法模組
│   │   ├── matching_logic.py # 配對邏輯協調器
│   │   ├── scorers.py       # 評分函數
│   │   └── filters.py       # 過濾函數
│   ├── models/
│   │   └── matching.py      # 資料模型
│   └── clients/             # 外部服務客戶端
│       ├── user_core_client.py
│       ├── resort_services_client.py
│       └── knowledge_engagement_client.py
└── tests/
```

## 分層架構

```
┌─────────────────────────────────────┐
│           Routers (API)             │  ← HTTP 請求/回應
├─────────────────────────────────────┤
│           Services                  │  ← 業務邏輯協調
├─────────────────────────────────────┤
│      Core (Scorers + Filters)       │  ← 演算法實作
├─────────────────────────────────────┤
│    Clients / Redis Repository       │  ← 外部服務/資料存取
└─────────────────────────────────────┘
```

## 模組職責

### main.py
- FastAPI 應用程式初始化
- 路由註冊
- 例外處理器註冊

### config.py
- 環境變數載入
- 應用程式設定集中管理

### services/
- `matching_service.py` - 配對流程協調
- `redis_repository.py` - Redis 操作抽象

### core/
- `scorers.py` - 5 個評分函數（技能、地點、時間、角色、知識）
- `filters.py` - 候選人過濾邏輯
- `matching_logic.py` - 總分計算協調器

### clients/
- 各外部服務的 HTTP 客戶端
- 統一使用 config 中的 URL

## API 端點

| Method | Path | 說明 |
|--------|------|------|
| POST | /matching/searches | 發起配對搜尋 |
| GET | /matching/searches/{id} | 取得搜尋結果 |
| POST | /requests | 發送配對請求 |
| PUT | /requests/{id} | 回應配對請求 |
| GET | /health | 健康檢查 |

## 設計原則

1. **單一職責** - 每個模組只負責一件事
2. **依賴注入** - 使用 FastAPI Depends
3. **關注點分離** - 路由、業務邏輯、演算法、資料存取分層
4. **配置外部化** - 環境變數管理設定
5. **統一錯誤處理** - 全域例外處理器
