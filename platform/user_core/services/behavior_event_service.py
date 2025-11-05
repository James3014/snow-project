from __future__ import annotations

from datetime import datetime, UTC
from time import perf_counter
import uuid
from typing import List, Optional, Sequence

from jsonschema import Draft202012Validator, FormatChecker, ValidationError
from sqlalchemy.orm import Session

from models import behavior_event as behavior_event_model
from schemas import behavior_event as behavior_event_schema
from services import event_schema_registry
from telemetry import metrics


class BehaviorEventValidationError(ValueError):
    """Raised when incoming events violate core governance rules."""


def _validate_core_event(event: behavior_event_schema.BehaviorEventCreate):
    definition = event_schema_registry.get_definition(event.event_type, event.version)
    if not definition:
        if event_schema_registry.is_core_event(event.event_type):
            available_versions = event_schema_registry.get_versions(event.event_type)
            raise BehaviorEventValidationError(
                f"Unsupported version '{event.version}' for event_type '{event.event_type}'. "
                f"Available versions: {available_versions}."
            )
        return

    allowed_sources = definition.get("allowed_sources")
    if allowed_sources and event.source_project not in allowed_sources:
        allowed_sorted = sorted(allowed_sources)
        raise BehaviorEventValidationError(
            f"event_type '{event.event_type}' v{event.version} must originate from one of {allowed_sorted}."
        )

    schema = definition.get("schema")
    if not schema:
        return

    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    try:
        validator.validate(event.payload)
    except ValidationError as exc:  # pragma: no cover - jsonschema provides message
        raise BehaviorEventValidationError(str(exc.message)) from exc


def _validate_event(event: behavior_event_schema.BehaviorEventCreate):
    if event.version < 1:
        raise BehaviorEventValidationError("version must be greater than or equal to 1.")
    if not event.payload:
        raise BehaviorEventValidationError("payload must not be empty.")

    _validate_core_event(event)


def create_event(
    db: Session,
    event: behavior_event_schema.BehaviorEventCreate,
) -> behavior_event_model.BehaviorEvent:
    start_time = perf_counter()
    _validate_event(event)

    event_payload = event.model_dump(exclude_none=True)
    if event_payload.get("schema_url"):
        event_payload["schema_url"] = str(event_payload["schema_url"])
    event_payload.setdefault("recorded_at", datetime.now(UTC))

    db_event = behavior_event_model.BehaviorEvent(**event_payload)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    metrics.record_timing(
        "user_core.create_behavior_event",
        perf_counter() - start_time,
        threshold_seconds=0.5,
    )
    return db_event


def get_events_by_user(
    db: Session,
    user_id: uuid.UUID,
    *,
    sort_by: behavior_event_schema.EventSortField,
    order: behavior_event_schema.SortOrder,
    source_projects: Optional[Sequence[str]] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[behavior_event_model.BehaviorEvent]:
    start_time = perf_counter()
    query = db.query(behavior_event_model.BehaviorEvent).filter(
        behavior_event_model.BehaviorEvent.user_id == user_id
    )

    if source_projects:
        query = query.filter(
            behavior_event_model.BehaviorEvent.source_project.in_(list(source_projects))
        )

    sortable_columns = {
        behavior_event_schema.EventSortField.occurred_at: behavior_event_model.BehaviorEvent.occurred_at,
        behavior_event_schema.EventSortField.recorded_at: behavior_event_model.BehaviorEvent.recorded_at,
    }
    sort_column = sortable_columns[sort_by]
    if order == behavior_event_schema.SortOrder.desc:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    results = query.offset(skip).limit(limit).all()
    metrics.record_timing(
        "user_core.query_behavior_events",
        perf_counter() - start_time,
        threshold_seconds=0.5,
    )
    return results
