# Calendar Implementation Snapshot

## Completed Scope
- Domain：Trip/Day/Item/Event/Buddy/Matching dataclasses with validation + enums。資料模型與 `202502150001_add_calendar_tables.py` 相互對應。
- Persistence：SQLAlchemy models + repositories + Alembic migration，覆蓋 trips/days/items/events/buddies/matching。
- Services：`TripService`（CRUD+Day/Item）、`CalendarEventService`（reminder 更新）、`TripBuddyService`、`MatchingService`。
- API：`platform/user_core/api/calendar.py` 提供 Trip/Event/Day/Item/Buddy/Matching 路由，全數強制 Auth、速率限制、Turnstile/Recaptcha（create/媒合）。
- Tests：`tests/domain/**`、`tests/services/**`、`tests/api/**` 依 TDD 覆蓋核心用例；`scripts/smoke_user_core.py` 新增 calendar smoke。
- Tooling/Docs：`CALENDAR_API.md`、`CALENDAR_MIGRATION.md`、`CALENDAR_TODO.md`、`SECURITY_RELEASE_CHECKLIST.md` 更新，`sitecustomize.py` 讓 Python 以 namespace 模式載入本地 `platform` 套件。

## Outstanding (pre-deploy only)
1. 環境變數：`TURNSTILE_SECRET/RECAPTCHA_SECRET`、`REDIS_URL`、`SENTRY_DSN/SENTRY_TRACES_SAMPLE_RATE`、`USER_CORE_API_KEY` 等需於 Vercel/Vercel KV 設定。
2. Bot/限流 Edge 化：前端/edge middleware 加入 Turnstile + Upstash Rate Limit，覆蓋 `/api/share-cards` 與 `/auth`。
3. 監控：若不用 Sentry，改綁 Logflare 或 Vercel Analytics，確保前/後端各自有 DSN/採樣率設定。
4. robots/noindex：正式網域出爐後更新 `robots.txt` Sitemap，敏感頁補 `<meta name="robots" content="noindex">`。
5. Auth：以 JWT 正式驗證取代 UUID dev token，統一 auth 模式避免 dev token 混用。
6. 測試安裝：本地執行 pytest 需先 `pip install -r platform/user_core/requirements.txt`；目前缺少 fastapi/starlette 導致測試無法啟動。

## Safety & Notes
- `_rate_limit` 同時支援 Redis（優先）與記憶體；失敗時自動退回內存，維持 50 req/min/user。
- `verify_captcha` 透過 `X-Captcha-Token`；API 測試覆蓋 create flow，但部署需綁定 Turnstile key。
- `sitecustomize.py` 會擴展 stdlib `platform` 的 `__path__`，讓 `from platform.user_core ...` 在 CLI/pytest 中可以運作；若在其他環境需要相同行為，記得把 repo 根目錄加入 `PYTHONPATH`。
- `docs/CALENDAR_TODO.md` 已全數打勾，僅剩環境/部署項。

## Next Actions
1. 安裝 user-core requirements 後跑：`pytest tests/domain tests/services tests/api`，再跑 `scripts/smoke_user_core.py`。
2. 寫 Edge Middleware（Turnstile + Upstash）並在 `/api/share-cards`、`/auth` 引用；確保機器人防護覆蓋。
3. 確認 `UNIFIED_SCHEMA_DESIGN.md` 中欄位皆已在 migration 內，若要擴增 Trip 模型請新增 Alembic 修訂。
4. 部署前再次執行 `docs/SECURITY_RELEASE_CHECKLIST.md`，並輸出 `PRE_DEPLOYMENT_CHECKLIST.md`。
