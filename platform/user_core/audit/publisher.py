import os
from typing import Any, Dict, Optional

import httpx

# This would be a list of subscriber URLs, loaded from config
SUBSCRIBER_URL = os.getenv("USER_CORE_CHANGEFEED_URL")


def publish_change(
    *,
    entity_type: str,
    entity_id: str,
    change_type: str,
    payload: Dict[str, Any],
    timeout_seconds: float = 5.0,
) -> None:
    """Publishes a change event to a configured webhook subscriber."""
    if not SUBSCRIBER_URL:
        print("WARN: No changefeed subscriber URL configured. Skipping publish.")
        return

    event_payload = {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "change_type": change_type,
        "payload": payload,
    }

    try:
        response = httpx.post(SUBSCRIBER_URL, json=event_payload, timeout=timeout_seconds)
        response.raise_for_status()
        print(f"SUCCESS: Published change for {entity_type}:{entity_id} to {SUBSCRIBER_URL}")
    except httpx.HTTPError as exc:  # pragma: no cover - network failure is logged
        print(f"ERROR: Failed to publish changefeed event: {exc}")
