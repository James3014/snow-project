"""Notification dispatcher for matching completion events."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

from ..config import get_settings


class MatchingNotificationDispatcher:
    """Best-effort webhook notifier when matching results are ready."""

    def __init__(self) -> None:
        settings = get_settings()
        self._webhook_url: Optional[str] = settings.matching_notification_webhook_url

    async def notify_completion(
        self,
        *,
        search_id: str,
        seeker_id: str,
        results: List[Dict[str, Any]],
    ) -> None:
        if not self._webhook_url:
            return

        payload = {
            "event": "matching.completed",
            "search_id": search_id,
            "seeker_id": seeker_id,
            "results": results,
        }

        async with httpx.AsyncClient(timeout=10) as client:
            try:
                await client.post(self._webhook_url, json=payload)
            except httpx.HTTPError:
                # Webhook failure should not break matching flow
                pass
