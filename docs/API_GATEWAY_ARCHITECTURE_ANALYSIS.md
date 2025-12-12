# API Gateway 架構評估

## 🎯 目標
評估當前微服務架構是否需要 API Gateway，並提出最適合的解決方案。

## 📊 當前架構分析

### 現有服務端點
```
Frontend (ski-platform) → 直接調用各服務
├── user-core:8001          (認證、用戶資料)
├── resort-api:8000         (雪場資訊)
├── snowbuddy-matching:8002 (雪伴匹配)
├── calendar-service:8003   (行事曆)
├── gear-service:8004       (裝備管理)
├── social-service:8005     (社交功能)
└── tour:3010              (行程規劃)
```

### 問題識別

#### 🔴 高優先級問題
1. **認證分散**: 每個服務都需要實作認證邏輯
2. **CORS 複雜**: 前端需要配置多個服務的 CORS
3. **服務發現**: 前端硬編碼服務端點
4. **錯誤處理**: 各服務錯誤格式不統一

#### 🟡 中優先級問題
1. **監控分散**: 無統一的請求追蹤
2. **速率限制**: 缺乏統一的 API 限流
3. **版本管理**: 服務版本升級影響前端

#### 🟢 低優先級問題
1. **快取策略**: 缺乏統一快取層
2. **負載均衡**: 單實例部署

## 🏗️ 解決方案評估

### 方案 A: 輕量級 API Gateway (推薦)

**技術選擇**: FastAPI + 統一路由

**優點**:
- ✅ 最小化複雜度
- ✅ 與現有 Python 生態整合
- ✅ 快速實作和部署
- ✅ 統一認證和錯誤處理

**實作架構**:
```
Frontend → API Gateway:8080 → 各微服務
                ├── /api/auth/*        → user-core:8001
                ├── /api/resorts/*     → resort-api:8000
                ├── /api/calendar/*    → calendar-service:8003
                ├── /api/gear/*        → gear-service:8004
                ├── /api/social/*      → social-service:8005
                ├── /api/matching/*    → snowbuddy-matching:8002
                └── /api/trips/*       → tour:3010
```

### 方案 B: Nginx 反向代理

**優點**:
- ✅ 高效能
- ✅ 成熟穩定
- ✅ 負載均衡內建

**缺點**:
- ❌ 認證邏輯複雜
- ❌ 動態路由困難
- ❌ 業務邏輯處理有限

### 方案 C: 雲端 API Gateway (AWS API Gateway)

**優點**:
- ✅ 完整功能
- ✅ 自動擴展
- ✅ 監控整合

**缺點**:
- ❌ 供應商鎖定
- ❌ 本地開發複雜
- ❌ 成本較高

## 🎯 推薦方案: 輕量級 API Gateway

### 核心功能
1. **統一認證**: JWT 驗證和用戶上下文傳遞
2. **路由管理**: 基於路徑的服務路由
3. **錯誤處理**: 統一錯誤格式和狀態碼
4. **CORS 處理**: 統一跨域配置
5. **請求日誌**: 統一請求追蹤和監控

### 實作計劃

#### Phase 1: 基礎 Gateway (T2.5)
```python
# api_gateway/main.py
from fastapi import FastAPI, Request, HTTPException
from services.shared.config_service import get_config_service
import httpx

app = FastAPI(title="SnowTrace API Gateway")
config = get_config_service()

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # 統一認證邏輯
    pass

@app.api_route("/api/{service_name}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_request(service_name: str, path: str, request: Request):
    # 服務代理邏輯
    pass
```

#### Phase 2: 進階功能 (T2.6-T2.7)
- 服務健康檢查
- 負載均衡
- 速率限制
- 快取層

### 遷移策略

#### 階段 1: 並行部署
- API Gateway 與現有服務並行運行
- 前端逐步遷移到 Gateway 端點
- 保持向後相容性

#### 階段 2: 流量切換
- 逐步將前端請求導向 Gateway
- 監控效能和錯誤率
- 保留直連作為備援

#### 階段 3: 完全遷移
- 移除前端直連邏輯
- 服務間通訊透過 Gateway
- 統一監控和日誌

## 📈 預期效益

### 開發效率
- 🚀 前端只需對接一個端點
- 🚀 統一的認證和錯誤處理
- 🚀 簡化的 CORS 配置

### 運維效率
- 📊 統一的監控和日誌
- 🔒 集中的安全控制
- ⚡ 統一的快取和限流

### 可維護性
- 🔧 服務版本管理
- 🔧 統一的 API 文檔
- 🔧 簡化的部署流程

## 🚦 實作優先級

1. **P1 (立即)**: 基礎 Gateway 實作 (T2.5)
2. **P2 (本週)**: 認證整合和路由 (T2.6)
3. **P3 (下週)**: 監控和錯誤處理 (T2.7)
4. **P4 (未來)**: 進階功能 (快取、限流)

## 🧪 測試策略

### 單元測試
- Gateway 路由邏輯
- 認證中間件
- 錯誤處理

### 整合測試
- 端到端 API 調用
- 服務間通訊
- 錯誤場景處理

### 效能測試
- 延遲測試
- 吞吐量測試
- 負載測試

---

**結論**: 採用輕量級 FastAPI Gateway，分階段實作，最小化風險並最大化效益。
