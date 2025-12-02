# Quickstart: Gear Operations & Maintenance

**Last Updated**: 2025-10-14  
**Pre-req**: Python 3.11+, PostgreSQL 15+, Redis/Celery 或 APScheduler, Docker（選用）, Poetry/uv

## 1. Setup

```bash
uv venv .venv
source .venv/bin/activate
pip install -r requirements-gear.txt  # FastAPI, SQLAlchemy, Pydantic, Celery/APS, redis, httpx, pytest, schemathesis

# PostgreSQL
docker run -d --name snowtrace-gear-pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=snowtrace_gear \
  -p 5434:5432 postgres:15

# Redis（若採用 Celery）
docker run -d --name snowtrace-gear-redis -p 6380:6379 redis:7
```

## 2. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEAR_DB_URL` | PostgreSQL 連線字串 | `postgresql+psycopg://postgres:secret@localhost:5434/snowtrace_gear` |
| `GEAR_REDIS_URL` | 任務排程 backend | `redis://localhost:6380/0` |
| `USER_CORE_BASE_URL` | user-core API | `http://localhost:8000` |
| `NOTIFICATION_GATEWAY_URL` | 通知服務 | `https://notify.local/send` |
| `GEAR_WEBHOOK_URL` | 接收 user-core change feed | `https://localhost:9600/user-core-hooks` |
| `GEAR_API_KEY` | API key | `dev-gear` |
| `PAYMENT_PROVIDER_URL` | 交易金流 stub | `https://sandbox.payments.local` |

將變數加入 `.env.gear` 並由啟動腳本載入。

## 3. Database Migration

```bash
alembic -c scripts/migrations/gear_ops/alembic.ini upgrade head

python scripts/migrations/gear_ops/import_legacy_gear.py \
  --source data/legacy_gear.csv \
  --db $GEAR_DB_URL
```

> 舊資料尚未確定格式；匯入腳本需支援乾跑與回滾。

## 4. Run the Service (Dev)

```bash
uvicorn platform.gear_ops.api:app --reload --port 8300

# Background jobs
celery -A platform.gear_ops.jobs.worker worker --loglevel=info
celery -A platform.gear_ops.jobs.worker beat --loglevel=info
```

健康檢查：

```bash
curl -H "x-api-key: dev-gear" http://localhost:8300/healthz
```

## 5. Seed Data (Optional)

```bash
python scripts/seeds/load_gear_templates.py \
  --source data/gear_checklist_templates.yaml \
  --db $GEAR_DB_URL

python scripts/seeds/load_sample_gear.py \
  --source data/sample_gear.json \
  --db $GEAR_DB_URL
```

## 6. Testing

```bash
pytest tests/unit/gear_ops
pytest tests/integration/gear_ops
pytest tests/contract/gear_ops

schemathesis run specs/gear-ops/contracts/api-openapi.yaml \
  --base-url=http://localhost:8300
```

## 7. Reminder Simulation

```bash
python scripts/tools/run_gear_reminder_simulation.py \
  --gear data/sample_gear.json \
  --inspections data/sample_inspections.json \
  --output tmp/reminder_report.json
```

檢查提醒觸發頻率、通知渠道與安全旗標。

## 8. Observability & Safety

- 建立 OpenTelemetry 指標：檢查完成率、提醒成功率、交易成功率。  
- 設定 `logs/gear-safety.log`，紀錄危險裝備與糾紛事件。  
- 變更 feed（webhook）需具備重試與死信佇列。  
- 建立告警：`gear.flag` 開啟後 1 小時未處理、提醒失敗連續 3 次等。

## 9. Deployment Checklist

1. 與 user-core/snowbuddy/resort-services 的 API 整合測試完成。  
2. 匯入遺留裝備資料並確認無重複/遺失。  
3. 通知偏好與提醒 SLA 演練（含危險裝備即時通知）。  
4. 交易流程（若含金流）需於 sandbox 測試並紀錄稅務資訊。  
5. 撰寫回滾策略：資料備份、提醒停用、交易暫停流程。  
