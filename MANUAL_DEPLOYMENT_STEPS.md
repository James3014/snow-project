# 🚀 SnowTrace 手動部署步驟

## ⚠️ 重要：環境變數需要手動設定

### 1. Resort API 部署

#### Zeabur 操作：
1. 登入 Zeabur Dashboard
2. 建立新服務 → 選擇 GitHub repo
3. 選擇 `resort_api` 目錄
4. 在環境變數頁面設定：

```bash
JWT_SECRET_KEY=jmNrssrb29z4GzzAo1tojsMQFXGWpdKjIL8jiS7hAZSQ8MHffq8Q1YbgpjvWC_AJ_7G1cpC1EeCt5xWdKV94ww
JWT_ALGORITHM=HS256
USER_CORE_API_URL=https://user-core.zeabur.app
RESORT_API_KEY=<生成隨機字串>
```

5. 部署完成後記錄 URL：`https://resort-api-xxx.zeabur.app`

### 2. Snowbuddy Matching 部署

#### Zeabur 操作：
1. 建立新服務
2. 選擇 `snowbuddy_matching` 目錄  
3. 設定環境變數：

```bash
JWT_SECRET_KEY=jmNrssrb29z4GzzAo1tojsMQFXGWpdKjIL8jiS7hAZSQ8MHffq8Q1YbgpjvWC_AJ_7G1cpC1EeCt5xWdKV94ww
JWT_ALGORITHM=HS256
USER_CORE_API_URL=https://user-core.zeabur.app
RESORT_SERVICES_API_URL=https://resort-api-xxx.zeabur.app  # 👈 步驟1的URL
SNOWBUDDY_API_KEY=<生成隨機字串>
REDIS_URL=<從Zeabur Redis服務複製>
```

4. 部署完成後記錄 URL：`https://snowbuddy-xxx.zeabur.app`

### 3. 更新現有服務

#### 更新 user-core 環境變數：
```bash
RESORT_API_BASE_URL=https://resort-api-xxx.zeabur.app
SNOWBUDDY_API_URL=https://snowbuddy-xxx.zeabur.app
```

### 4. Tour 部署 (Vercel)

#### Vercel 操作：
1. 連接 GitHub repo
2. 選擇 `tour` 目錄
3. 設定環境變數：

```bash
DATABASE_URL=<PostgreSQL連線字串>
USER_CORE_API_URL=https://user-core.zeabur.app
RESORT_API_BASE_URL=https://resort-api-xxx.zeabur.app
SNOWBUDDY_API_URL=https://snowbuddy-xxx.zeabur.app
```

### 5. Ski Platform 部署 (Vercel)

#### Vercel 操作：
1. 選擇 `platform/frontend/ski-platform` 目錄
2. 設定環境變數：

```bash
VITE_USER_CORE_API_URL=https://user-core.zeabur.app
VITE_RESORT_API_URL=https://resort-api-xxx.zeabur.app
VITE_SNOWBUDDY_API_URL=https://snowbuddy-xxx.zeabur.app
VITE_TOUR_API_URL=https://tour-xxx.vercel.app
```

## 🔧 環境變數生成工具

```bash
# 生成 API Key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# 生成 JWT 密鑰
python3 scripts/generate_jwt_secret.py
```

## ✅ 部署驗證

每個服務部署後執行：

```bash
# 檢查健康狀態
curl https://your-service.zeabur.app/health

# 檢查 API 文檔
curl https://your-service.zeabur.app/docs
```

## 📝 部署記錄

- [ ] resort-api: `https://_______.zeabur.app`
- [ ] snowbuddy-matching: `https://_______.zeabur.app`  
- [ ] tour: `https://_______.vercel.app`
- [ ] ski-platform: `https://_______.vercel.app`
