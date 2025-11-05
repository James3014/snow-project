# Quickstart: Knowledge Engagement & Skill Growth

**Last Updated**: 2025-10-14  
**Pre-req**: Python 3.11+, PostgreSQL 15+, Redis/Celery, Docker（選用）, Poetry/uv

## 1. Setup

```bash
uv venv .venv
source .venv/bin/activate
pip install -r requirements-knowledge.txt  # FastAPI, SQLAlchemy, Pydantic, redis, celery/apscheduler, pillow, numpy, pandas, pytest, schemathesis

docker run -d --name skidiy-knowledge-pg \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=skidiy_knowledge \
  -p 5436:5432 postgres:15

docker run -d --name skidiy-knowledge-redis -p 6382:6379 redis:7
```

## 2. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `KNOWLEDGE_DB_URL` | PostgreSQL 連線字串 | `postgresql+psycopg://postgres:secret@localhost:5436/skidiy_knowledge` |
| `KNOWLEDGE_REDIS_URL` | 任務/快取 backend | `redis://localhost:6382/0` |
| `USER_CORE_BASE_URL` | user-core API | `http://localhost:8000` |
| `RESORT_SERVICES_BASE_URL` | resort-services API | `http://localhost:8400` |
| `GEAR_OPS_BASE_URL` | gear-ops API | `http://localhost:8300` |
| `NOTIFICATION_GATEWAY_URL` | 通知服務 | `https://notify.local/send` |
| `KNOWLEDGE_WEBHOOK_URL` | user-core change feed webhook | `https://localhost:9800/user-core-hooks` |
| `ACHIEVEMENT_ASSETS_PATH` | 成就圖像素材 | `./assets/achievements` |

## 3. Database Migration

```bash
alembic -c scripts/migrations/knowledge/alembic.ini upgrade head

python scripts/migrations/knowledge/import_question_bank.py \
  --source data/question_bank_seed.yaml \
  --db $KNOWLEDGE_DB_URL
```

> `question_bank_seed.yaml` 需包含題目、選項、答案、主題、難度等欄位；支援多語。

## 4. Run the Service (Dev)

```bash
uvicorn platform.knowledge.api:app --reload --port 8500

# Background jobs
celery -A platform.knowledge.jobs.worker worker --loglevel=info
celery -A platform.knowledge.jobs.worker beat --loglevel=info
```

健康檢查：

```bash
curl -H "x-api-key: dev-knowledge" http://localhost:8500/healthz
```

## 5. Seed Data (Optional)

```bash
python scripts/seeds/load_sample_questions.py \
  --source data/sample_questions.json \
  --db $KNOWLEDGE_DB_URL

python scripts/seeds/load_achievements.py \
  --source data/achievement_templates.json \
  --db $KNOWLEDGE_DB_URL
```

## 6. Testing

```bash
pytest tests/unit/knowledge
pytest tests/integration/knowledge
pytest tests/contract/knowledge

schemathesis run specs/knowledge-engagement/contracts/api-openapi.yaml \
  --base-url=http://localhost:8500
```

## 7. Simulation Scripts

```bash
# 模擬測驗與技能分數
python scripts/tools/simulate_quiz_flow.py \
  --users data/sample_users.json \
  --output tmp/quiz_simulation_report.json

# 教練任務指派示範
python scripts/tools/demo_practice_assignments.py \
  --assignments data/sample_assignments.yaml \
  --output tmp/assignment_log.json
```

## 8. Observability

- 指標：測驗成功率、平均得分、任務完成率、成就達成數。  
- 日誌：`logs/quiz_engine.log`, `logs/assignment.log`.  
- Change feed 需具備重試機制。  
- 任務提醒需監控失敗率與延遲。

## 9. Deployment Checklist

1. 題庫審核通過並匯入正式環境。  
2. 成就與徽章素材確認品牌一致。  
3. 與 user-core/resort/gear 之 API 整合測試完成。  
4. 通知頻率設定並乾跑（測驗提醒、任務提醒）。  
5. 設定回滾策略：題庫版本控制、成績備份、任務取消流程。  
