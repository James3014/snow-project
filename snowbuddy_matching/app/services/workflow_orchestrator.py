"""Workflow dispatching helpers for Snowbuddy matching."""
from __future__ import annotations

from typing import Optional

from fastapi import BackgroundTasks

from ..config import get_settings
from ..models.matching import MatchingPreference
from .matching_service import MatchingService, get_matching_service
from .workflow_clients import get_matching_workflow_client


class MatchingWorkflowOrchestrator:
    """Coordinates between local matching service and durable workflows."""

    def __init__(
        self,
        matching_service: MatchingService,
        workflow_client: Optional[MatchingWorkflowClient] = None,
    ) -> None:
        self._matching_service = matching_service
        self._workflow_client = workflow_client

    async def start_matching(
        self,
        *,
        search_id: str,
        seeker_id: str,
        seeker_preferences: MatchingPreference,
        background_tasks: Optional[BackgroundTasks] = None,
    ) -> None:
        """Kick off the matching workflow using LDF when available."""

        if self._workflow_client:
            settings = get_settings()
            await self._workflow_client.start_matching_workflow(
                search_id=search_id,
                seeker_id=seeker_id,
                seeker_preferences=seeker_preferences.model_dump(),
                callback_webhook=settings.matching_workflow_callback_url,
                timeout_seconds=settings.matching_workflow_timeout_seconds,
            )
            return

        # Fallback: run existing in-process background task.
        if background_tasks is not None:
            background_tasks.add_task(
                self._matching_service.run_matching,
                search_id,
                seeker_id,
                seeker_preferences,
            )
        else:
            await self._matching_service.run_matching(search_id, seeker_id, seeker_preferences)


_orchestrator: Optional[MatchingWorkflowOrchestrator] = None


def get_matching_workflow_orchestrator() -> MatchingWorkflowOrchestrator:
    """Return a cached orchestrator instance."""

    global _orchestrator
    if _orchestrator is None:
        workflow_client = get_matching_workflow_client()
        _orchestrator = MatchingWorkflowOrchestrator(
            matching_service=get_matching_service(),
            workflow_client=workflow_client,
        )
    return _orchestrator
