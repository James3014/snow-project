"""Shared workflow client factories."""
from __future__ import annotations

from typing import Optional

from ..clients.workflow_client import MatchingWorkflowClient
from ..config import get_settings


_matching_client: Optional[MatchingWorkflowClient] = None
_matching_client_initialized = False


def get_matching_workflow_client() -> Optional[MatchingWorkflowClient]:
    """Return cached MatchingWorkflowClient if configured."""

    global _matching_client, _matching_client_initialized
    if not _matching_client_initialized:
        settings = get_settings()
        if settings.matching_workflow_url:
            _matching_client = MatchingWorkflowClient(
                base_url=settings.matching_workflow_url,
                auth_mode=settings.matching_workflow_auth_mode,
                api_key=settings.matching_workflow_api_key,
                api_key_header=settings.matching_workflow_api_key_header,
                aws_region=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                aws_session_token=settings.aws_session_token,
                sigv4_service=settings.matching_workflow_sigv4_service,
            )
        _matching_client_initialized = True
    return _matching_client
