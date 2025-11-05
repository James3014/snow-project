# SkiDIY 統一認證架構

## 概述

所有 SkiDIY 服務使用統一的認證機制，以 **user-core** 作為認證中心。

## 認證流程

```
Client Application
      ↓
   [登入 user-core]
      ↓
  獲取 access_token
      ↓
   [使用 token 訪問其他服務]
      ↓
  resort-services / snowbuddy-matching
      ↓
   [驗證 token with user-core]
      ↓
    處理請求
```

## 實作狀態

### ✅ 已實現

1. **user-core 認證端點**
   - `POST /auth/login` - 登入並獲取 token
   - `GET /auth/validate` - 驗證 token 的有效性

2. **共享認證模組** (`shared/auth.py`)
   - `get_current_user_id()` - 從請求中提取並驗證用戶 ID
   - `get_optional_user_id()` - 可選的用戶認證
   - 支援兩種認證方式：
     - Bearer token (生產環境)
     - X-User-Id header (開發/內部服務)

3. **服務整合準備**
   - resort-services: 已添加 auth_utils.py
   - snowbuddy-matching: 可使用共享模組

## 使用方式

### 1. User-Core 認證 API

#### 登入
```bash
POST /auth/login
Content-Type: application/json

{
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}

# Response
{
  "access_token": "550e8400-e29b-41d4-a716-446655440000",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 驗證 Token
```bash
GET /auth/validate
Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000

# Response
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "valid"
}
```

### 2. 在其他服務中使用認證

#### Resort-Services 範例
```python
from fastapi import Depends
from auth_utils import get_current_user_id

@app.post("/users/{user_id}/ski-history")
async def create_ski_history(
    user_id: str,
    history_item: SkiHistoryCreate,
    authenticated_user_id: str = Depends(get_current_user_id)
):
    # 驗證用戶只能為自己添加記錄
    if user_id != authenticated_user_id:
        raise HTTPException(403, "Forbidden")

    # 處理請求...
```

#### Snowbuddy-Matching 範例
```python
from fastapi import Depends
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[2]))
from shared.auth import get_current_user_id

@app.post("/matching/searches")
async def start_search(
    preferences: MatchingPreference,
    user_id: str = Depends(get_current_user_id)
):
    # user_id 已經過認證
    # 執行匹配邏輯...
```

### 3. 客戶端使用

#### 方式 1: Bearer Token (推薦)
```bash
# 1. 登入取得 token
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user_id": "550e8400-e29b-41d4-a716-446655440000"}'

# 2. 使用 token 訪問服務
curl http://localhost:8000/users/550e8400-e29b-41d4-a716-446655440000/ski-history \
  -H "Authorization: Bearer 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"resort_id": "hokkaido_niseko", "date": "2025-01-15"}'
```

#### 方式 2: X-User-Id Header (開發環境)
```bash
# 僅在開發環境可用
curl http://localhost:8000/users/550e8400-e29b-41d4-a716-446655440000/ski-history \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"resort_id": "hokkaido_niseko", "date": "2025-01-15"}'
```

## 安全考量

### 開發環境
- 支援 `X-User-Id` header 直接傳遞用戶 ID
- 簡化開發和測試流程
- **不應在生產環境使用**

### 生產環境
- **必須**使用 Bearer token
- Token 由 user-core 簽發
- 所有服務向 user-core 驗證 token
- `X-User-Id` header 在生產環境中會被拒絕

## 環境變量

```bash
# user-core
# (暫無額外配置)

# resort-services
USER_CORE_API_URL=http://localhost:8001
ENVIRONMENT=development  # or 'production'

# snowbuddy-matching
USER_CORE_API_URL=http://localhost:8001
ENVIRONMENT=development  # or 'production'
```

## 實作檢查清單

### ✅ 已完成
- [x] user-core 認證 API (`/auth/login`, `/auth/validate`)
- [x] 共享認證模組 (`shared/auth.py`)
- [x] resort-services 認證工具 (`auth_utils.py`)
- [x] 認證架構文檔

### 🔄 進行中
- [ ] 在 resort-services 所有需要認證的端點中應用
- [ ] 在 snowbuddy-matching 所有需要認證的端點中應用
- [ ] JWT token 實作（目前使用簡化版）

### 📋 待辦
- [ ] 實作完整的 JWT 簽名和驗證
- [ ] Token 過期機制
- [ ] Refresh token 機制
- [ ] OAuth 2.0 整合（可選）
- [ ] API key 管理（用於服務間通信）

## 遷移指南

### 現有端點遷移

1. **識別需要認證的端點**
   - 修改用戶資料的操作
   - 創建資源的操作
   - 查看私密資訊的操作

2. **添加認證依賴**
   ```python
   from fastapi import Depends
   from auth_utils import get_current_user_id

   @app.post("/endpoint")
   async def endpoint(
       user_id: str = Depends(get_current_user_id)
   ):
       # 使用 authenticated user_id
   ```

3. **更新測試**
   - 在測試中添加認證 headers
   - 使用 `X-User-Id` for 單元測試
   - 使用 Bearer token for 整合測試

## 示例場景

### 場景 1: 用戶記錄滑雪歷史

```python
# Client
response = requests.post(
    "http://localhost:8000/users/user-123/ski-history",
    headers={"Authorization": "Bearer user-123"},
    json={"resort_id": "hokkaido_niseko", "date": "2025-01-15"}
)

# Resort-Services
# 1. 從 header 提取 token
# 2. 調用 user-core /auth/validate 驗證
# 3. 確認 user-123 == authenticated_user_id
# 4. 處理請求
```

### 場景 2: 用戶搜尋雪伴

```python
# Client
response = requests.post(
    "http://localhost:8002/matching/searches",
    headers={"Authorization": "Bearer user-456"},
    json={"skill_level_min": 5, "skill_level_max": 7}
)

# Snowbuddy-Matching
# 1. 從 header 提取並驗證 token
# 2. 使用 authenticated_user_id 進行匹配
# 3. 返回結果
```

## 故障處理

### 錯誤代碼

- `401 Unauthorized` - 未提供認證或認證無效
- `403 Forbidden` - 已認證但無權限執行操作
- `503 Service Unavailable` - user-core 認證服務不可用

### 調試技巧

1. 檢查 user-core 健康狀態：`GET /health`
2. 驗證 token：`GET /auth/validate` with Authorization header
3. 查看服務日誌中的認證錯誤
4. 確認環境變量 `USER_CORE_API_URL` 正確設置

## 總結

✅ **統一認證架構已建立**
- 所有服務使用 user-core 作為認證中心
- 提供共享的認證模組供所有服務使用
- 支援開發和生產環境的不同認證方式
- 清晰的認證流程和使用文檔

🔄 **下一步**
- 在所有需要的端點應用認證
- 實作完整的 JWT token 機制
- 添加 token 刷新和過期處理
