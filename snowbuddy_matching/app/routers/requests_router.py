"""
Match request routes - sending and responding to match requests.
"""
from fastapi import APIRouter, HTTPException, Body, Depends, status
from typing import Literal
from datetime import datetime, UTC
import uuid

from ..clients import user_core_client
from ..auth_utils import get_current_user_id
from ..exceptions import ExternalServiceError

router = APIRouter(tags=["requests"])


@router.post("/requests", status_code=status.HTTP_202_ACCEPTED)
async def send_match_request(
    target_user_id: str = Body(..., embed=True),
    requester_id: str = Depends(get_current_user_id)
):
    """Send a match request to another user."""
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
        raise ExternalServiceError("user-core")
    return {"status": "request sent", "request_id": request_id}


@router.put("/requests/{request_id}", status_code=status.HTTP_200_OK)
async def respond_to_match_request(
    request_id: str,
    action: Literal['accept', 'decline'] = Body(..., embed=True),
    responder_id: str = Depends(get_current_user_id)
):
    """Respond to a received match request."""
    event = {
        "user_id": responder_id,
        "source_project": "snowbuddy-matching",
        "event_type": f"snowbuddy.match.request.{action}ed",
        "occurred_at": datetime.now(UTC).isoformat(),
        "payload": {"request_id": request_id}
    }
    success = await user_core_client.post_event(event)
    if not success:
        raise ExternalServiceError("user-core")
    return {"status": f"request {action}ed"}
