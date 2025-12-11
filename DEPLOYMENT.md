# SnowTrace 部署指南

## 快速部署

### 本地開發環境

```bash
# 啟動所有服務
docker-compose up --build

# 服務端點
# - User Core: http://localhost:8001
# - Resort API: http://localhost:8000  
# - Snowbuddy Matching: http://localhost:8002
# - Frontend: http://localhost:3000
# - Tour Planner: http://localhost:3010
```

### 生產環境部署

#### Zeabur 部署

每個服務都支援獨立部署：

1. **User Core Service**
   - 構建目錄: `platform/user_core`
   - 端口: 8001
   - 需要: PostgreSQL 數據庫

2. **Resort API Service**
   - 構建目錄: `resort_api`
   - 端口: 8000
   - 無數據庫依賴

3. **Snowbuddy Matching Service**
   - 構建目錄: `snowbuddy_matching`
   - 端口: 8002
   - 需要: Redis (可選)

4. **Frontend**
   - 構建目錄: `platform/frontend/ski-platform`
   - 端口: 80

5. **Tour Planner**
   - 構建目錄: `tour`
   - 端口: 3000
   - 需要: PostgreSQL 數據庫

#### 環境變數

```bash
# User Core
USER_CORE_DB_URL=postgresql://user:pass@host:5432/db
JWT_SECRET_KEY=your-secret-key

# Resort API  
USER_CORE_API_URL=http://user-core:8001

# Snowbuddy Matching
USER_CORE_API_URL=http://user-core:8001
RESORT_SERVICES_API_URL=http://resort-api:8000
REDIS_URL=redis://redis:6379

# Tour Planner
DATABASE_URL=postgresql://user:pass@host:5432/trip_planner
USER_CORE_API_URL=http://user-core:8001
RESORT_API_BASE_URL=http://resort-api:8000
```

## 架構特點

- ✅ 微服務架構，支援獨立部署
- ✅ 統一認證系統
- ✅ 自包含服務，無共享模組依賴
- ✅ 標準化 Docker 配置
- ✅ 環境感知配置
