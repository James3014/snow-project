# Security Release Checklist（精簡版）

## 已完成
- JWT：user_core 簽發/驗證 HS256，shared/auth 支援本地驗證與 fallback；resort_api / snowbuddy_matching 支援 jose。
- 雙密鑰輪替：`JWT_FALLBACK_SECRET`/`jwt_fallback_secret`。
- Bot 防護：user_core auth & share-cards、resort_api share-card、snowbuddy_matching search 支援 Turnstile/recaptcha (`X-Captcha-Token`)。
- 限流：上述高成本路由支援 Redis（優先）/記憶體。
- API Key：user_core share-cards、resort_api share-card、snowbuddy_matching 搜尋可強制 Key。
- 前端：管理頁 noindex；robots.txt 已有佔位 Sitemap。
- 監控：前後端支援 Sentry；ErrorBoundary 移除敏感 log。
- 工具：scripts/generate_jwt_secret.py；Smoke 腳本 3 份。

## 部署必填
- JWT：`JWT_SECRET_KEY` (+`JWT_FALLBACK_SECRET`)、`JWT_ALGORITHM=HS256`、`JWT_AUDIENCE=user_core`、`JWT_ISSUER=SnowTrace`。
- Redis：`REDIS_URL`（或 `RESORT_API_REDIS_URL`）用於限流。
- CAPTCHA：`TURNSTILE_SECRET` 或 `RECAPTCHA_SECRET`；前端 `VITE_TURNSTILE_SITE_KEY`；呼叫端傳 `X-Captcha-Token`。
- API Key：`USER_CORE_API_KEY`、`RESORT_API_KEY`、`SNOWBUDDY_API_KEY`（可用 `*_REQUIRE_API_KEY=false` 放寬）。
- Sentry：前端 `VITE_SENTRY_DSN`；後端 `SENTRY_DSN`（可選 `SENTRY_TRACES_SAMPLE_RATE`）。
- robots.txt：替換 Sitemap 為正式域名。

## 上線前驗證
- user_core：`USER_CORE_BASE_URL=... TOKEN=<jwt> python scripts/smoke_user_core.py`
- resort_api：`RESORT_API_BASE_URL=... TOKEN=<jwt> X_API_KEY=... python scripts/smoke_resort_api.py`
- snowbuddy_matching：`SNOWBUDDY_BASE_URL=... TOKEN=<jwt> X_API_KEY=... python scripts/smoke_snowbuddy.py`
- 手動確認：未授權拒絕、限流出 429、Captcha 行為符合預期。

## 後續可選
- Edge/Upstash 中心化限流；Webhook/通知簽章驗證。
- 更多敏感頁 noindex；正式 Sitemap。
- CI 安全煙囪：未授權掃描、rate-limit 測試、自動跑 Smoke。 
