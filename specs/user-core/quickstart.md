# Quickstart: Unified Rider Identity Core

**Last Updated**: 2025-10-14  
**Pre-req**: Python 3.11+, PostgreSQL 15+ (或等效)、Poetry/uv、Docker（選用）

## 1. Setup

```bash
# 建議使用 uv 或 pipx
uv venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # 待建置：含 FastAPI、SQLAlchemy、Pydantic、psycopg、alembic、pytest

# 建立本地 PostgreSQL（若使用 Docker）
docker run -d --name snowtrace-pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=snowtrace_user_core \
  -p 5432:5432 postgres:15
```

## 2. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `USER_CORE_DB_URL` | PostgreSQL 連線字串 | `postgresql+psycopg://postgres:secret@localhost:5432/snowtrace_user_core` |
| `USER_CORE_CHANGEFEED_URL` | Change feed 目標（預設 HTTPS webhook gateway） | `https://localhost:9000/changefeed/user-core` |
| `USER_CORE_LOG_LEVEL` | Logging 層級 | `INFO` |
| `USER_CORE_API_KEY` | 發佈 API key（若使用簡易 auth） | `dev-secret` |

在 `.env`（加入 `.gitignore`）或 `.specify/scripts` 自動 export。

## 3. Database Migration

```bash
# 建立資料庫 schema（Alembic）
alembic upgrade head

# 若已有舊資料，可先產生遷移腳本
python scripts/migrations/user_core/backfill_members.py \
  --members members-utf8.csv \
  --output tmp/user_profile_backfill.csv
```

> 【提醒】遷移腳本需支援回滾與雙寫，部署前務必於 staging 演練。

## 4. Run the Service (Dev)

```bash
uvicorn platform.user_core.api:app --reload --port 8000
```

測試健康檢查：

```bash
curl -H "x-api-key: dev-secret" http://localhost:8000/healthz
```

## 5. Seed Data (Optional)

```bash
python scripts/seeds/load_sample_users.py \
  --source data/sample_users.json \
  --db $USER_CORE_DB_URL

python scripts/seeds/load_preference_templates.py \
  --source data/notification_preference_templates.yaml \
  --db $USER_CORE_DB_URL
```

載入後可用 `GET /users?limit=10` 確認。

## 6. Testing

```bash
pytest tests/unit/user_core
pytest tests/contract/user_core  # 使用 openapi schema 驗證
pytest tests/integration/user_core
```

必要時整合 `schemathesis` 對 API 進行 property-based 測試。

## 7. Change Feed Replay

```bash
python scripts/changefeed/replay.py \
  --since 2025-10-01T00:00:00Z \
  --type UserProfile \
  --consumer snowbuddy-matching
```

確保 downstream 可重播並對 merge 事件 idempotent 處理。

> 後續若事件量增大，可替換 `USER_CORE_CHANGEFEED_URL` 為 Kafka/SNS broker，並啟用資料庫重播腳本支援雙軌輸送。

## 8. Observability

- 預計接入 OpenTelemetry：追蹤 API latency、事件寫入成功率。  
- 審計日誌輸出至 `logs/audit.log`，部署後需導入集中式 log 平台。  
- Change feed 需提供死信隊列監控。

## 9. Deployment Checklist

1. 完成資料遷移腳本 dry run + 回滾測試。  
2. 確認 change feed subscriber 已配置（coach-scheduling 等）。  
3. 驗證舊系統雙寫期間的監控（錯誤率、延遲）。  
4. 進行負載測試（寫入 50k events/day 等級）。  
5. 確保 `.codex/`、`.specify/` 中敏感設定未被 commit。
