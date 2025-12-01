# Resort API 架構說明

## 目錄結構

```
resort_api/
├── app/
│   ├── __init__.py
│   ├── main.py              # 應用程式入口點
│   ├── config.py            # 集中配置管理
│   ├── exceptions.py        # 自定義例外與全域處理器
│   ├── db.py                # 資料存取層
│   ├── data_loader.py       # YAML 資料載入
│   ├── card_generator.py    # 分享卡片圖片生成
│   ├── auth_utils.py        # 認證工具
│   ├── routers/             # API 路由模組
│   │   ├── __init__.py
│   │   ├── resort_router.py # 雪場相關端點
│   │   ├── history_router.py# 滑雪歷史端點
│   │   └── health_router.py # 健康檢查端點
│   ├── services/            # 業務邏輯層
│   │   ├── __init__.py
│   │   ├── resort_service.py# 雪場查詢邏輯
│   │   └── history_service.py# 歷史記錄邏輯
│   └── models/              # 資料模型
│       ├── __init__.py
│       ├── resort.py        # 雪場相關模型
│       └── history.py       # 歷史記錄模型
└── tests/
```

## 分層架構

```
┌─────────────────────────────────────┐
│           Routers (API)             │  ← HTTP 請求/回應
├─────────────────────────────────────┤
│           Services                  │  ← 業務邏輯
├─────────────────────────────────────┤
│           Models                    │  ← 資料結構
├─────────────────────────────────────┤
│           DB / Data Loader          │  ← 資料存取
└─────────────────────────────────────┘
```

## 模組職責

### main.py
- FastAPI 應用程式初始化
- CORS 中介軟體配置
- 路由註冊
- 例外處理器註冊

### config.py
- 環境變數載入
- 應用程式設定集中管理
- 使用 pydantic-settings

### exceptions.py
- 自定義例外類別
- 全域例外處理器

### routers/
- HTTP 端點定義
- 請求驗證
- 回應格式化
- 依賴注入

### services/
- 業務邏輯實作
- 快取管理
- 外部服務呼叫

### models/
- Pydantic 資料模型
- 請求/回應 schema
- 資料驗證

## API 端點

| Method | Path | 說明 |
|--------|------|------|
| GET | /resorts | 雪場列表（支援過濾、搜尋、分頁）|
| GET | /resorts/{id} | 雪場詳情 |
| GET | /resorts/{id}/share-card | 分享卡片圖片 |
| POST | /users/{id}/ski-history | 記錄滑雪歷史 |
| GET | /health | 健康檢查 |

## 設計原則

1. **單一職責** - 每個模組只負責一件事
2. **依賴注入** - 使用 FastAPI Depends
3. **關注點分離** - 路由、業務邏輯、資料存取分層
4. **配置外部化** - 環境變數管理設定
5. **統一錯誤處理** - 全域例外處理器
