# 統一目錄結構規範

## 服務目錄結構標準

```
services/{service-name}/
├── main.py              # FastAPI 應用入口
├── {service}_service.py # 核心服務邏輯
├── requirements.txt     # Python 依賴
├── Dockerfile          # 容器化配置
├── tests/              # 測試目錄
│   ├── test_service.py # 服務測試
│   └── test_api.py     # API 測試
├── docs/               # 服務文檔
│   └── README.md       # 服務說明
└── .env.example        # 環境變數範例
```

## 已標準化的服務

### ✅ calendar-service
- `services/calendar-service/main.py`
- `services/calendar-service/calendar_service.py`
- `services/calendar-service/requirements.txt`
- `services/calendar-service/Dockerfile`

### ✅ gear-service
- `services/gear-service/main.py`
- `services/gear-service/gear_service.py`
- `services/gear-service/requirements.txt`
- `services/gear-service/Dockerfile`

### ✅ social-service
- `services/social-service/main.py`
- `services/social-service/social_service.py`
- `services/social-service/requirements.txt`
- `services/social-service/Dockerfile`

## 配置標準

### 環境變數命名
- `{SERVICE_NAME}_PORT`: 服務端口
- `{SERVICE_NAME}_DATABASE_URL`: 資料庫連接
- `USER_CORE_URL`: 認證服務地址
- `REDIS_URL`: Redis 連接

### 端口分配
- user-core: 8001
- resort-api: 8000
- snowbuddy-matching: 8002
- calendar-service: 8003
- gear-service: 8004
- social-service: 8005
