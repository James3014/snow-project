# Snowbuddy Durable Workflow 環境設定指南

此文件列出部署 Snowbuddy Matching 服務時需要配置的所有 Durable Workflow 相關環境變數，並說明搬遷/切換雲端時要注意的項目。

## 1. Workflow HTTP 入口

| 變數 | 說明 |
| --- | --- |
| `MATCHING_WORKFLOW_URL` | API Gateway 或 Function URL，例如 `https://xxxx.execute-api.us-east-2.amazonaws.com/prod`。任何變更（區域、stage）都要更新此項。 |
| `MATCHING_WORKFLOW_AUTH_MODE` | `api_key`（預設）或 `iam_sigv4`。若未設會回退本地 Redis。 |
| `MATCHING_WORKFLOW_API_KEY` | `api_key` 模式下的金鑰；變更 API Gateway stage 或 key 時需更新。 |
| `MATCHING_WORKFLOW_API_KEY_HEADER` | API key 標頭名稱，預設 `X-API-Key`；若改用自訂 header 需同步。 |
| `MATCHING_WORKFLOW_SIGV4_SERVICE` | SigV4 服務名稱；API Gateway 通常 `execute-api`，Lambda Function URL 請改為 `lambda`。 |

## 2. AWS 認證（僅 SigV4）

| 變數 | 說明 |
| --- | --- |
| `AWS_REGION` | AWS 區域（例如 `us-east-2`）。搬家到其他區域時務必同步更新。 |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` | IAM 使用者或角色的憑證，需具備呼叫 API Gateway / Function URL 的權限。更換 IAM 或使用臨時憑證時，要更新這些欄位。 |

## 3. Workflow 行為

| 變數 | 說明 |
| --- | --- |
| `MATCHING_WORKFLOW_TIMEOUT_SECONDS` | 單次搜尋的逾時計時；預設 3600。若 workflow 設定有調整，這裡也要同步。 |
| `MATCHING_WORKFLOW_CALLBACK_URL` | Workflow 完成後回呼 SnowTrace 的 URL。搬遷後端或變更域名時務必更新。 |
| `MATCHING_NOTIFICATION_WEBHOOK_URL` | Local fallback 模式專用的通知 webhook；若生產只用 Durable Workflow，可留空。 |

## 4. DynamoDB / 狀態儲存

Durable Workflow 端目前使用 `matching-workflow-state`（us-east-2）存放狀態。如果未來換表名稱或 TTL 規則，SnowTrace 不需調整；但若增加額外查詢端點，需在 `MATCHING_WORKFLOW_URL` 提供對應 API。

## 5. `.env` 範例（Function URL + IAM SigV4）

```bash
# Durable workflow with Lambda Function URL
MATCHING_WORKFLOW_URL=https://xxxxx.lambda-url.us-east-2.on.aws
MATCHING_WORKFLOW_AUTH_MODE=iam_sigv4
MATCHING_WORKFLOW_SIGV4_SERVICE=lambda

# AWS credentials (use deployment-specific secrets)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=<ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<SECRET_KEY>
# AWS_SESSION_TOKEN=<SESSION_TOKEN>  # 如果使用臨時憑證才需要

# Optional knobs
MATCHING_WORKFLOW_TIMEOUT_SECONDS=3600
MATCHING_WORKFLOW_CALLBACK_URL=https://snowbuddy.example.com/webhooks/matching
MATCHING_NOTIFICATION_WEBHOOK_URL=
```

把這段複製進 Zeabur 的 Variables（或本地 `.env`）後，就算 Snowbuddy 還沒部署，也能隨時準備好配置。

## 6. 文件位置

- `snowbuddy_matching/README.md` 內的「Durable Workflow Integration」表格；若新增變數或支援其他授權，請同步該處。
- 本文件 `docs/LDF_ENVIRONMENT.md` 建議放在部署 runbook 中引用，並在 CI/CD pipeline 產生 `.env` 或 secret 時讀取。

## 6. 搬遷/災難備援建議

1. **區域切換**：同步更新 `MATCHING_WORKFLOW_URL`、`AWS_REGION`、`MATCHING_WORKFLOW_SIGV4_SERVICE`（若 API Gateway → Function URL）。
2. **金鑰輪替**：若使用 API key，務必同時更新 `MATCHING_WORKFLOW_API_KEY`；並將舊值撤銷。
3. **Webhook 網址變更**：調整 `MATCHING_WORKFLOW_CALLBACK_URL` 及任何下游通知 pipeline。
4. **回退計畫**：留意若 `MATCHING_WORKFLOW_URL` 清空，Snowbuddy 會自動回退 Redis background task；必要時可透過 `MATCHING_NOTIFICATION_WEBHOOK_URL` 即時觀察結果。

保持此文件更新，可確保未來換區域/換雲端時不遺漏關鍵設定。
