"""
History routes - ski history recording endpoints.
"""
from fastapi import APIRouter, Depends, status

from ..models import SkiHistoryCreate
from ..services import ResortService, HistoryService
from ..db import get_resorts_db
from ..exceptions import ResortNotFoundError, ForbiddenError
from ..auth_utils import get_current_user_id

router = APIRouter(prefix="/users", tags=["history"])


def get_resort_service() -> ResortService:
    return ResortService(get_resorts_db())


def get_history_service() -> HistoryService:
    return HistoryService()


@router.post("/{user_id}/ski-history", status_code=status.HTTP_202_ACCEPTED)
async def create_ski_history(
    user_id: str,
    history_item: SkiHistoryCreate,
    authenticated_user_id: str = Depends(get_current_user_id),
    resort_service: ResortService = Depends(get_resort_service),
    history_service: HistoryService = Depends(get_history_service)
):
    """Record a ski history entry. Users can only create history for themselves."""
    if user_id != authenticated_user_id:
        raise ForbiddenError("You can only create ski history for yourself")
    
    if not resort_service.exists(history_item.resort_id):
        raise ResortNotFoundError(history_item.resort_id)
    
    await history_service.record_visit(user_id, history_item)
    return {"status": "accepted"}
