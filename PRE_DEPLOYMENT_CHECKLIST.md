# 🚀 SnowTrace 部署準備檢查清單

## 📋 部署前檢查

### 1. 安全配置 ✅
- [x] JWT 密鑰已生成 (`scripts/generate_jwt_secret.py`)
- [x] API Keys 已配置
- [x] Bot 防護 (Turnstile/reCAPTCHA) 已設定
- [x] 限流機制已啟用 (Redis)
- [x] Sentry 監控已整合

### 2. 環境變數檢查
```bash
# 必填變數
JWT_SECRET_KEY=<generated_secret>
JWT_ALGORITHM=HS256
JWT_AUDIENCE=user_core
JWT_ISSUER=SnowTrace

# Redis (限流)
REDIS_URL=<redis_connection_string>

# API Keys
USER_CORE_API_KEY=<api_key>
RESORT_API_KEY=<api_key>
SNOWBUDDY_API_KEY=<api_key>

# CAPTCHA
TURNSTILE_SECRET=<secret>
VITE_TURNSTILE_SITE_KEY=<site_key>

# 監控
SENTRY_DSN=<dsn>
VITE_SENTRY_DSN=<frontend_dsn>
```

### 3. 服務部署順序
1. **user-core** (認證中心)
2. **resort-api** (雪場資料)
3. **snowbuddy-matching** (媒合引擎)
4. **tour** (行程規劃)
5. **ski-platform** (前端)

### 4. 部署後驗證
```bash
# 執行 Smoke 測試
USER_CORE_BASE_URL=<url> TOKEN=<jwt> python scripts/smoke_user_core.py
RESORT_API_BASE_URL=<url> TOKEN=<jwt> python scripts/smoke_resort_api.py
SNOWBUDDY_BASE_URL=<url> TOKEN=<jwt> python scripts/smoke_snowbuddy.py

# 或使用整合測試腳本
./test_zeabur_deployment.sh
```

## 🎯 部署平台建議

### Zeabur (推薦)
- **優勢**: 自動 CI/CD、環境變數管理、日誌監控
- **適用**: user-core, resort-api, snowbuddy-matching
- **配置**: zeabur.json 已準備就緒

### Vercel (前端)
- **適用**: ski-platform, tour (Next.js)
- **配置**: 環境變數需手動設定

## 📊 監控設置

### 1. 健康檢查端點
- `/health` - 所有後端服務
- 預期回應: `{"status": "ok"}`

### 2. 效能監控
- Sentry 錯誤追蹤
- API 回應時間監控
- 限流狀態監控

### 3. 日誌監控
- 認證失敗事件
- API 限流觸發
- Bot 防護攔截

## ⚠️ 部署注意事項

### 資料庫
- PostgreSQL 連線字串已配置
- 遷移腳本已執行
- 備份策略已建立

### 網域設定
- CORS 設定已更新
- robots.txt 已配置正式域名
- SSL 憑證已啟用

### 效能優化
- Redis 快取已啟用
- 靜態資源 CDN 已配置
- 圖片壓縮已優化

## 🔄 回滾計劃

### 快速回滾
1. Zeabur 一鍵回滾到前一版本
2. 資料庫遷移回滾腳本
3. DNS 切換備用服務

### 緊急聯絡
- 技術負責人: [聯絡資訊]
- 監控告警: Sentry + Email
- 狀態頁面: [狀態頁面 URL]

---

**部署負責人**: ________________  
**檢查日期**: ________________  
**部署日期**: ________________
