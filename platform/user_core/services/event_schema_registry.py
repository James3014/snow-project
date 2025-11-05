from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple

CoreEventKey = Tuple[str, int]
CoreEventDefinition = Dict[str, Any]

# Central registry for core (governed) events. Additional events can be appended
# as new projects on-board; non-core events fall back to caller-provided data.
# 需同步更新 specs/shared/event_catalog.yaml。
CORE_EVENT_DEFINITIONS: Dict[CoreEventKey, CoreEventDefinition] = {
    ("resort.visited", 1): {
        "allowed_sources": {"resort-services"},
        "schema": {
            "type": "object",
            "required": ["resort_id", "date"],
            "properties": {
                "resort_id": {"type": "string", "minLength": 1},
                "date": {"type": "string", "format": "date"},
            },
            "additionalProperties": False,
        },
    },
    ("snowbuddy.match.request.sent", 1): {
        "allowed_sources": {"snowbuddy-matching"},
        "schema": {
            "type": "object",
            "required": ["request_id", "target_user_id"],
            "properties": {
                "request_id": {"type": "string", "minLength": 1},
                "target_user_id": {"type": "string", "format": "uuid"},
                "metadata": {"type": "object"},
            },
            "additionalProperties": True,
        },
    },
    ("snowbuddy.match.request.accepted", 1): {
        "allowed_sources": {"snowbuddy-matching"},
        "schema": {
            "type": "object",
            "required": ["request_id"],
            "properties": {
                "request_id": {"type": "string", "minLength": 1},
                "initiator_user_id": {"type": "string", "format": "uuid"},
            },
            "additionalProperties": True,
        },
    },
    ("snowbuddy.match.request.declined", 1): {
        "allowed_sources": {"snowbuddy-matching"},
        "schema": {
            "type": "object",
            "required": ["request_id"],
            "properties": {
                "request_id": {"type": "string", "minLength": 1},
                "reason": {"type": "string"},
            },
            "additionalProperties": True,
        },
    },
}


def is_core_event(event_type: str) -> bool:
    """Return True when the event_type is governed by the registry."""
    return any(key[0] == event_type for key in CORE_EVENT_DEFINITIONS.keys())


def get_definition(event_type: str, version: int) -> Optional[CoreEventDefinition]:
    """Fetch the definition for a governed event."""
    return CORE_EVENT_DEFINITIONS.get((event_type, version))


def get_versions(event_type: str) -> List[int]:
    """Return the set of versions maintained for a given event type."""
    return sorted(
        version
        for (etype, version) in CORE_EVENT_DEFINITIONS.keys()
        if etype == event_type
    )


def iter_allowed_sources() -> Iterable[str]:
    """Yield the union of allowed sources across governed events."""
    for definition in CORE_EVENT_DEFINITIONS.values():
        for source in definition.get("allowed_sources", []):
            yield source
