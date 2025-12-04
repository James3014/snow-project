"""
Search routes - matching search endpoints.
"""
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, status

from ..models.matching import MatchingPreference
from ..services import (
    MatchingWorkflowOrchestrator,
    get_matching_workflow_orchestrator,
    MatchingService,
    get_matching_service,
)
from ..exceptions import SearchNotFoundError
from ..auth_utils import get_current_user_id

router = APIRouter(prefix="/matching", tags=["matching"])


@router.post("/searches", status_code=status.HTTP_202_ACCEPTED)
async def start_search(
    seeker_prefs: MatchingPreference,
    background_tasks: BackgroundTasks,
    seeker_id: str = Depends(get_current_user_id),
    orchestrator: MatchingWorkflowOrchestrator = Depends(get_matching_workflow_orchestrator),
):
    """Initiate a new snowbuddy search. Runs matching in background."""
    search_id = str(uuid.uuid4())
    await orchestrator.start_matching(
        search_id=search_id,
        seeker_id=seeker_id,
        seeker_preferences=seeker_prefs,
        background_tasks=background_tasks,
    )
    return {"search_id": search_id}


@router.get("/searches/{search_id}")
async def get_search_results(
    search_id: str,
    authenticated_user_id: str = Depends(get_current_user_id),
    service: MatchingService = Depends(get_matching_service)
):
    """Retrieve status and results of a snowbuddy search."""
    result = await service.get_results(search_id)
    if not result:
        raise SearchNotFoundError(search_id)
    return result
