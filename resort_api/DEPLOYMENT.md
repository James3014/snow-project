# Resort Services API Deployment Guide

This guide provides instructions for building and running the Resort Services API using Docker and Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

Make sure both Docker and Docker Compose are installed on your system before proceeding.

## Running the Application

1.  **Navigate to the Project Root:**
    Open your terminal and change to the root directory of this project (`snowtrace/project`).

2.  **Build and Run with Docker Compose:**
    Execute the following command:

    ```bash
    docker-compose up --build
    ```

    This command will build the Docker image for the `resort-api` service (if it doesn't exist or has changed) and start the container. The `--build` flag ensures the image is up-to-date with any code changes.

3.  **Verify the Service:**
    Once the container is running, the API will be accessible on your local machine.

    You can check its health by sending a request to the `/health` endpoint:

    ```bash
    curl http://localhost:8000/health
    ```

    You should receive a response similar to this:

    ```json
    {"status":"ok","resort_count":43}
    ```

    The API documentation (Swagger UI) is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Stopping the Application

To stop the running service, press `Ctrl+C` in the terminal where `docker-compose` is running. To remove the container, you can run:

```bash
docker-compose down
```
