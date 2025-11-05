from fastapi import APIRouter, HTTPException, status, Body, Depends
from typing import Literal
from datetime import datetime, UTC
import uuid

from snowbuddy_matching.app.clients import user_core_client
from snowbuddy_matching.app.auth_utils import get_current_user_id

router = APIRouter()

@router.post("/requests", status_code=status.HTTP_202_ACCEPTED)
async def send_match_request(
    target_user_id: str = Body(..., embed=True),
    requester_id: str = Depends(get_current_user_id)
):
    """
    Sends a match request to another user.

    Requires authentication. The request will be sent from the authenticated user.
    """
    request_id = str(uuid.uuid4())
    event = {
        "user_id": requester_id,
        "source_project": "snowbuddy-matching",
        "event_type": "snowbuddy.match.request.sent",
        "occurred_at": datetime.now(UTC).isoformat(),
        "payload": {
            "request_id": request_id,
            "target_user_id": target_user_id
        }
    }
    success = await user_core_client.post_event(event)
    if not success:
        raise HTTPException(status_code=503, detail="Failed to send event to user-core service.")
    return {"status": "request sent", "request_id": request_id}


@router.put("/requests/{request_id}", status_code=status.HTTP_200_OK)
async def respond_to_match_request(
    request_id: str,
    action: Literal['accept', 'decline'] = Body(..., embed=True),
    responder_id: str = Depends(get_current_user_id)
):
    """
    Responds to a received match request.

    Requires authentication. The response will be recorded for the authenticated user.
    """
    event_type = f"snowbuddy.match.request.{action}ed"
    event = {
        "user_id": responder_id,
        "source_project": "snowbuddy-matching",
        "event_type": event_type,
        "occurred_at": datetime.now(UTC).isoformat(),
        "payload": {
            "request_id": request_id
        }
    }
    success = await user_core_client.post_event(event)
    if not success:
        raise HTTPException(status_code=503, detail="Failed to send event to user-core service.")
    return {"status": f"request {action}ed"}
