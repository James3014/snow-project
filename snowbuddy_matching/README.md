# Snowbuddy Matching Service

This service provides an intelligent matching engine to help users find ski and snowboard partners (snowbuddies).

## Features

- **Health Check**: A simple `/health` endpoint to verify service status.
- **Background Search**: Initiates a partner search as a background task via `POST /matching/searches`.
- **Result Retrieval**: Fetches search results using a unique search ID via `GET /matching/searches/{search_id}`.
- **Lifecycle Management**: Manages match requests (send, accept, decline) by posting events to the `user-core` service.

## Running Locally

1.  **Install Dependencies**:
    ```bash
    # Create and activate a virtual environment
    python3 -m venv .venv
    source .venv/bin/activate

    # Install requirements
    pip install -r requirements.txt
    ```

2.  **Run the Service**:
    ```bash
    uvicorn snowbuddy_matching.app.main:app --reload --port 8002
    ```

## Running with Docker

This service is designed to be run as part of the larger `snowtrace` project using Docker Compose.

1.  **Navigate to the Project Root**.

2.  **Run Docker Compose**:
    ```bash
    docker-compose up --build
    ```

    The service will be available at `http://localhost:8002`.

## Durable Workflow Integration

This service can offload heavy matching流程到 AWS Lambda Durable Functions。設定以下環境變數即可啟用（任一部署方式皆適用）：

| 變數 | 說明 |
| --- | --- |
| `MATCHING_WORKFLOW_URL` | 遠端 workflow API Gateway 或 Function URL（例如 `https://xxx.execute-api.us-east-2.amazonaws.com/prod`） |
| `MATCHING_WORKFLOW_AUTH_MODE` | `api_key`（預設）或 `iam_sigv4` |
| `MATCHING_WORKFLOW_API_KEY` | 若採 `api_key` 模式，填入 `X-API-Key` 值 |
| `MATCHING_WORKFLOW_API_KEY_HEADER` | API key 的標頭名稱，預設 `X-API-Key` |
| `MATCHING_WORKFLOW_SIGV4_SERVICE` | SigV4 服務名稱（API Gateway= `execute-api`、Function URL = `lambda`） |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` | 若採 `iam_sigv4` 模式需提供 |
| `MATCHING_WORKFLOW_CALLBACK_URL` | Workflow 完成後要回呼的 webhook（可指向 SnowTrace 通知服務） |
| `MATCHING_WORKFLOW_TIMEOUT_SECONDS` | 單次搜尋的逾時計時（秒），預設 `3600` |
| `MATCHING_NOTIFICATION_WEBHOOK_URL` | 本地背景模式完成時要通知的 URL |

未設定 `MATCHING_WORKFLOW_URL` 時，系統會自動回退到 FastAPI `BackgroundTasks + Redis` 模式。想確認 webhook 是否收到事件，可透過 `MATCHING_NOTIFICATION_WEBHOOK_URL` 指向任何可觀察的 endpoint。Durable Workflow 端的 API 介面請參考專案內的 `docs` 或 AWS 發佈的規格。 
