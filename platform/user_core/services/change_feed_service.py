from __future__ import annotations

from datetime import datetime, UTC
from typing import Any, Dict, Optional
import uuid

from sqlalchemy.orm import Session

from models import change_feed as change_feed_model
from audit import logger, publisher


def _safe_actor(actor_id: Optional[str]) -> str:
    return actor_id or "system"


def _build_diff(before: Optional[Dict[str, Any]], after: Optional[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    diff: Dict[str, Dict[str, Any]] = {}
    before_data = before or {}
    after_data = after or {}
    keys = set(before_data.keys()) | set(after_data.keys())
    for key in sorted(keys):
        if before_data.get(key) != after_data.get(key):
            diff[key] = {"before": before_data.get(key), "after": after_data.get(key)}
    return diff


def build_payload(
    *,
    actor_id: Optional[str],
    before: Optional[Dict[str, Any]],
    after: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Constructs a change payload that captures before/after state and field diffs."""
    actor = _safe_actor(actor_id)
    change_payload = {
        "actor": actor,
        "before": before,
        "after": after,
        "diff": _build_diff(before, after),
        "recorded_at": datetime.now(UTC).isoformat(),
    }
    return change_payload


def create_change_event(
    db: Session,
    *,
    entity_type: str,
    entity_id: uuid.UUID,
    change_type: str,
    payload: Dict[str, Any],
) -> change_feed_model.ChangeFeed:
    """Create a change event row without committing."""
    change_event = change_feed_model.ChangeFeed(
        entity_type=entity_type,
        entity_id=entity_id,
        change_type=change_type,
        payload=payload,
    )
    db.add(change_event)
    logger.log_change(payload.get("actor", "system"), entity_type, {"change_type": change_type, "diff": payload.get("diff", {})})
    return change_event


def publish_change_event(change_event: change_feed_model.ChangeFeed) -> None:
    """Publish a change event to external subscribers."""
    try:
        publisher.publish_change(
            entity_type=change_event.entity_type,
            entity_id=str(change_event.entity_id),
            change_type=change_event.change_type,
            payload=change_event.payload,
        )
    except Exception as exc:  # pragma: no cover - defensive logging
        print(f"ERROR: Failed to publish change event: {exc}")
