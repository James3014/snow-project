# Snowbuddy Matching：Redis → Durable Workflow 升級說明

## 🎯 主題概覽
- 目標：把原先依賴 FastAPI 背景任務 + Redis 的媒合流程，升級為 AWS Durable Workflow（Lambda Function + DynamoDB 狀態）以獲得可重試、可等待、可觀測的長流程執行。
- ASCII 全貌：`SnowTrace FastAPI` ──► `Durable API (SigV4/API Key)` ──► `Lambda Durable Workflow` ──► `DynamoDB State`

## 🏗️ 架構視圖
┌───────────────┐    ┌────────────────────┐    ┌────────────────────────────┐    ┌──────────────────────┐
│ FastAPI (Local)│──►│ Matching Workflow  │──►│ Lambda Durable Functions   │──►│ DynamoDB State Table │
│ /matching API  │   │ Client (SigV4/AKey)│   │ + Callbacks/Webhooks      │   │ matching-workflow-*  │
└───────────────┘    └────────────────────┘    └────────────────────────────┘    └──────────────────────┘
- FastAPI 保留 `POST /matching/searches` 與 `GET /matching/searches/{id}`；但調度改由 `workflow_orchestrator` 判斷使用 Durable 或 Redis。
- Workflow Client 依 `MATCHING_WORKFLOW_AUTH_MODE` 切換 API Key / SigV4，統一包裝 HTTP + 簽名邏輯。
- Lambda Durable Workflow 透過 `context.step()`、`context.wait()` 等 API 執行多步驟媒合並寫入 DynamoDB。

## 🔄 流程分解
開始 ─► [建立 search_id + payload] ─► [Workflow Orchestrator 決策] ─► [Durable workflow start 呼叫] ─► [Lambda 持續執行/等待] ─► [結果寫入 DynamoDB + callback] ─► [GET 查詢結果或 webhook 接收]
            │                               │                                     │
            └── 無 `MATCHING_WORKFLOW_URL` → Redis 背景任務        └── context.wait() 期間無計費        └── callback 失敗 → Lambda retry + Dead Letter
- 關鍵決策：檢查 `MATCHING_WORKFLOW_URL` 與 `MATCHING_WORKFLOW_AUTH_MODE`，缺失時自動回退舊模式。
- Workflow 具備 `context.wait()`/`continue_as_new()`，可安全等待外部 API、人工操作或 webhook 回傳。

## 🧩 組件詳解
┌──────────────────────────┬─────────────────────────────────────────────────────┐
│ 組件/檔案                │ 功能說明                                            │
├──────────────────────────┼─────────────────────────────────────────────────────┤
│ `app/services/workflow_orchestrator.py` │ 決策 Durable/Redis，統一 search 建立流程 │
│ `app/clients/workflow_client.py`        │ 封裝 SigV4/API Key 認證與 `/workflows` 呼叫│
│ `app/services/matching_service.py`      │ 讀寫搜尋結果，Durable 模式改向遠端查詢   │
│ `docs/LDF_ENVIRONMENT.md`               │ 記錄所有 Durable 相關環境變數與部署注意  │
│ `docs/LDF_TEST_REPORT.md`               │ 本地整合測試報告、待辦項目               │
│ AWS DynamoDB `matching-workflow-state`  │ 保存 execution 狀態、任務上下文、payload │
└──────────────────────────┴─────────────────────────────────────────────────────┘
- SigV4 實作採用 `botocore.auth.SigV4Auth`，確保 Function URL 亦能驗證。
- Callback webhook (`MATCHING_WORKFLOW_CALLBACK_URL`) 需接受 `search_id`, `status`, `payload`，以便 SnowTrace 即時更新 UI。
- Redis 背景任務與 Durable Workflow 共存，可透過環境變數快速切換。

## ⚡ 互動場景 / 實際案例
使用者 → `POST /matching/searches` → Workflow Orchestrator → (SigV4) → `https://xxx.lambda-url/.../workflows/matching/start`
- **情境：國際教練審核等待**
  - 申請者尋找國際 CASI 認證教練，需等待外部供應商（例如「GlobalCoach」API）約 15 分鐘的背景審核結果。
  - **改造前（Redis 背景任務）**：BackgroundTask 受限於 Pod 重啟與 Redis TTL，一旦審核超過 10 分鐘，任務常在 worker 重啟或 TTL 到期時遺失；使用者需要重送請求或客服介入。
  - **改造後（Durable Workflow）**：Lambda workflow 在 `context.wait()` 中等待外部 webhook；就算等待 30 分鐘也不計費，狀態存在 DynamoDB，Pod 重啟不會影響。Webhook 返回後 workflow 喚醒 → 寫入結果 → 觸發 callback，SnowTrace UI 即時反應，避免人工重送。
- 此情境突顯 Durable Workflow 適合「長等待 + 需可靠通知」的媒合任務。

## 📊 優劣勢比較
┌────────────────┬───────────────────────┬────────────────────────┐
│ 項目           │ 原本 Redis 背景任務 │ Durable Workflow (LDF) │
├────────────────┼───────────────────────┼────────────────────────┤
│ 等待成本       │ 需自建 retry/鎖，Pod 重啟易中斷 │ 0 計費等待，狀態持久化至 DDB │
│ 擴展與多節點   │ 單服務共享狀態困難             │ API Gateway/Function URL 跨服務共享 │
│ 可靠度         │ TTL/worker crash 造成任務遺失   │ Retry/timeout/logs 由 workflow 提供 │
│ 開發複雜度     │ 簡單但流程耦合 FastAPI        │ 初次設定 SigV4/環境較多，但流程乾淨 │
│ 回退策略       │ 需停機改程式                   │ 僅清空 `MATCHING_WORKFLOW_URL` 即回退 │
└────────────────┴───────────────────────┴────────────────────────┘
- 建議在「跨服務共享」、「 >5 分鐘等待」、「需外部 webhook」的媒合場景優先採用 Durable。

## 🔧 實施建議
1. **部署與 IAM**：為 Durable Workflow 建立 API Gateway 或 Function URL，配置 IAM policy（SigV4 模式）與 API Key（fallback）。
2. **環境設定**：依 `docs/LDF_ENVIRONMENT.md` 與 `.env.example` 填入 `MATCHING_WORKFLOW_*`、AWS 金鑰、Webhook URL。
3. **驗證流程**：
   - 本地：設 `MATCHING_WORKFLOW_URL` 指向 mock server（例如 webhook.site）驗證 SigV4、callback。
   - 雲端：透過 `docs/LDF_TEST_REPORT.md` 的腳本執行整合測試，確認 DynamoDB 產生紀錄。
4. **回退保險**：部署時保留 Redis，若 Durable 發生異常只需移除 `MATCHING_WORKFLOW_URL` 或切換 `MATCHING_WORKFLOW_AUTH_MODE=None` 即可回退。
5. **擴展思考**：同樣模式可延伸至 CASI Sync、TripBuddy、Gear Reminder 等長時程 workflow，並可在 API Gateway 加入批次查詢、取消、人工干預等端點。

## 參考
- `snowbuddy_matching/README.md` 的 Durable Workflow Integration 表格（環境變數摘要）
- `docs/LDF_ENVIRONMENT.md`：環境設定細節
- `docs/LDF_TEST_REPORT.md`：測試腳本與排錯流程
- AWS 官方：Lambda Function URLs、Step Functions/Durable Workflow API
