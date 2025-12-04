"""Client for triggering matching workflows on the LDF layer."""
from __future__ import annotations

import json
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials


class MatchingWorkflowClient:
    """Thin HTTP client that triggers Snowbuddy matching workflows."""

    def __init__(
        self,
        *,
        base_url: str,
        auth_mode: str = "api_key",
        api_key: Optional[str] = None,
        api_key_header: str = "X-API-Key",
        aws_region: Optional[str] = None,
        aws_access_key_id: Optional[str] = None,
        aws_secret_access_key: Optional[str] = None,
        aws_session_token: Optional[str] = None,
        sigv4_service: str = "execute-api",
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._auth_mode = auth_mode.lower()
        self._api_key = api_key
        self._api_key_header = api_key_header
        self._sigv4_service = sigv4_service
        self._aws_region = aws_region
        self._aws_credentials: Optional[Credentials] = None
        if self._auth_mode == "iam_sigv4":
            if not (aws_region and aws_access_key_id and aws_secret_access_key):
                raise ValueError("SigV4 auth mode requires AWS region and credentials")
            self._aws_credentials = Credentials(
                access_key=aws_access_key_id,
                secret_key=aws_secret_access_key,
                token=aws_session_token,
            )

    async def start_matching_workflow(
        self,
        *,
        search_id: str,
        seeker_id: str,
        seeker_preferences: Dict[str, Any],
        callback_webhook: Optional[str],
        timeout_seconds: int,
    ) -> Dict[str, Any]:
        """Invoke the remote workflow orchestrator."""

        payload: Dict[str, Any] = {
            "search_id": search_id,
            "seeker_id": seeker_id,
            "preferences": seeker_preferences,
            "timeout_seconds": timeout_seconds,
        }
        if callback_webhook:
            payload["callback_webhook"] = callback_webhook

        response = await self._request(
            method="POST",
            path="/workflows/matching/start",
            json_body=payload,
        )
        return response or {"status": "accepted", "search_id": search_id}

    async def get_search_status(
        self,
        search_id: str,
        *,
        include_candidates: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Fetch workflow-managed search status/results."""

        query = ""
        if include_candidates:
            query = "?" + urlencode({"include_candidates": "true"})

        try:
            return await self._request(
                method="GET",
                path=f"/workflows/matching/{search_id}{query}",
            )
        except httpx.HTTPStatusError as exc:  # pragma: no cover - httpx translates 404
            if exc.response.status_code == 404:
                return None
            raise

    async def _request(
        self,
        *,
        method: str,
        path: str,
        json_body: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        url = f"{self._base_url}{path}"
        headers: Dict[str, str] = {"Content-Type": "application/json"}
        content: Optional[bytes] = None
        if json_body is not None:
            content = json.dumps(json_body).encode("utf-8")

        if self._auth_mode == "api_key":
            if not self._api_key:
                raise ValueError("MATCHING_WORKFLOW_API_KEY must be set for api_key mode")
            headers[self._api_key_header] = self._api_key
        elif self._auth_mode == "iam_sigv4":
            headers = self._sign_request(method, url, headers, content)

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=content,
            )
            response.raise_for_status()
            if not response.content:
                return None
            return response.json()

    def _sign_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        body: Optional[bytes],
    ) -> Dict[str, str]:
        if not (self._aws_credentials and self._aws_region):
            raise ValueError("AWS credentials/region must be set for SigV4 auth")

        aws_request = AWSRequest(method=method, url=url, data=body)
        for key, value in headers.items():
            aws_request.headers[key] = value

        SigV4Auth(self._aws_credentials, self._sigv4_service, self._aws_region).add_auth(aws_request)
        # botocore returns a case-insensitive dict; convert to normal dict[str, str]
        return {k: v for k, v in aws_request.headers.items()}
