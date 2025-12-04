"""Workflow dispatchers bridging domain events to LDF orchestrators."""
from __future__ import annotations

from typing import Any, Dict, Optional
import uuid

import httpx
from fastapi import BackgroundTasks

from config.settings import get_settings
from models.trip_planning import TripBuddy
from models.course_tracking import CourseRecommendation
from models.gear import GearReminder
from services.casi_skill_analyzer import update_casi_profile_task


class _WorkflowHttpAdapter:
    def __init__(self, base_url: Optional[str], api_key: Optional[str] = None) -> None:
        self._base_url = base_url.rstrip("/") if base_url else None
        self._api_key = api_key

    @property
    def configured(self) -> bool:
        return bool(self._base_url)

    def post(self, path: str, payload: Dict[str, Any]) -> None:
        if not self._base_url:
            return
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        url = f"{self._base_url}{path}"
        try:
            with httpx.Client(timeout=10) as client:
                client.post(url, json=payload, headers=headers)
        except httpx.HTTPError:
            # Remote workflow dispatch failures are logged upstream; ignore here to avoid crashes
            pass


class CasiWorkflowDispatcher:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = _WorkflowHttpAdapter(
            settings.casi_workflow_url,
            settings.casi_workflow_api_key,
        )

    def dispatch(self, *, user_id: uuid.UUID, background_tasks: BackgroundTasks) -> None:
        if self._client.configured:
            background_tasks.add_task(self._trigger_remote, user_id)
        else:
            background_tasks.add_task(update_casi_profile_task, user_id)

    def _trigger_remote(self, user_id: uuid.UUID) -> None:
        self._client.post(
            "/workflows/casi/sync",
            {"user_id": str(user_id)},
        )


class TripBuddyWorkflowDispatcher:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = _WorkflowHttpAdapter(
            settings.tripbuddy_workflow_url,
            settings.tripbuddy_workflow_api_key,
        )

    def notify_request_created(self, buddy: TripBuddy, owner_id: uuid.UUID) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/tripbuddy/request-created",
            {
                "buddy_id": str(buddy.buddy_id),
                "trip_id": str(buddy.trip_id),
                "requester_id": str(buddy.user_id),
                "owner_id": str(owner_id),
                "requested_at": buddy.requested_at.isoformat() if buddy.requested_at else None,
            },
        )

    def notify_request_updated(self, buddy: TripBuddy) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/tripbuddy/request-updated",
            {
                "buddy_id": str(buddy.buddy_id),
                "status": buddy.status.value if hasattr(buddy.status, "value") else str(buddy.status),
                "responded_at": buddy.responded_at.isoformat() if buddy.responded_at else None,
            },
        )

    def notify_request_cancelled(self, buddy_id: uuid.UUID) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/tripbuddy/request-cancelled",
            {"buddy_id": str(buddy_id)},
        )


class CourseRecommendationWorkflowDispatcher:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = _WorkflowHttpAdapter(
            settings.course_recommendation_workflow_url,
            settings.course_recommendation_workflow_api_key,
        )

    def notify_submitted(self, rec: CourseRecommendation) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/course-recommendation/submitted",
            {
                "recommendation_id": str(rec.id),
                "user_id": str(rec.user_id),
                "resort_id": rec.resort_id,
                "rank": rec.rank,
                "status": rec.status,
            },
        )

    def notify_moderated(self, rec: CourseRecommendation) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/course-recommendation/moderated",
            {
                "recommendation_id": str(rec.id),
                "status": rec.status,
                "reviewed_at": rec.reviewed_at.isoformat() if rec.reviewed_at else None,
            },
        )


class GearReminderWorkflowDispatcher:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = _WorkflowHttpAdapter(
            settings.gear_reminder_workflow_url,
            settings.gear_reminder_workflow_api_key,
        )

    def schedule(self, reminder: GearReminder) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/gear-reminder/schedule",
            {
                "reminder_id": str(reminder.id),
                "gear_item_id": str(reminder.gear_item_id),
                "scheduled_at": reminder.scheduled_at.isoformat() if reminder.scheduled_at else None,
                "reminder_type": reminder.reminder_type,
                "message": reminder.message,
            },
        )

    def cancel(self, reminder_id: uuid.UUID) -> None:
        if not self._client.configured:
            return
        self._client.post(
            "/workflows/gear-reminder/cancel",
            {"reminder_id": str(reminder_id)},
        )


_casi_dispatcher: Optional[CasiWorkflowDispatcher] = None
_tripbuddy_dispatcher: Optional[TripBuddyWorkflowDispatcher] = None
_course_rec_dispatcher: Optional[CourseRecommendationWorkflowDispatcher] = None
_gear_dispatcher: Optional[GearReminderWorkflowDispatcher] = None


def get_casi_workflow_dispatcher() -> CasiWorkflowDispatcher:
    global _casi_dispatcher
    if _casi_dispatcher is None:
        _casi_dispatcher = CasiWorkflowDispatcher()
    return _casi_dispatcher


def get_tripbuddy_workflow_dispatcher() -> TripBuddyWorkflowDispatcher:
    global _tripbuddy_dispatcher
    if _tripbuddy_dispatcher is None:
        _tripbuddy_dispatcher = TripBuddyWorkflowDispatcher()
    return _tripbuddy_dispatcher


def get_course_recommendation_workflow_dispatcher() -> CourseRecommendationWorkflowDispatcher:
    global _course_rec_dispatcher
    if _course_rec_dispatcher is None:
        _course_rec_dispatcher = CourseRecommendationWorkflowDispatcher()
    return _course_rec_dispatcher


def get_gear_reminder_workflow_dispatcher() -> GearReminderWorkflowDispatcher:
    global _gear_dispatcher
    if _gear_dispatcher is None:
        _gear_dispatcher = GearReminderWorkflowDispatcher()
    return _gear_dispatcher
