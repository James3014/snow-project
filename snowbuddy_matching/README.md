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

This service is designed to be run as part of the larger `skidiy` project using Docker Compose.

1.  **Navigate to the Project Root**.

2.  **Run Docker Compose**:
    ```bash
    docker-compose up --build
    ```

    The service will be available at `http://localhost:8002`.
