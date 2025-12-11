"""
Trip Request Routes - applying to join trips and managing participants
"""
from fastapi import APIRouter, HTTPException, Body, Depends, status
from typing import Literal, Optional
from datetime import datetime, UTC
import uuid

from ..clients import user_core_client
from ..auth_utils import get_current_user_id
from ..exceptions import ExternalServiceError
from ..services.trip_integration import TripIntegrationService
from ..services.behavior_event_service import BehaviorEventService
from ..models.trip_participant import TripParticipantCreate, TripParticipantResponse

router = APIRouter(tags=["trip-requests"])


@router.post("/trips/{trip_id}/apply", status_code=status.HTTP_202_ACCEPTED)
async def apply_to_trip(
    trip_id: str,
    applicant_id: str = Depends(get_current_user_id)
):
    """Apply to join a trip."""
    request_id = str(uuid.uuid4())
    
    # 記錄申請事件
    event = {
        "user_id": applicant_id,
        "source_project": "snowbuddy-matching",
        "event_type": "snowbuddy.trip.apply.sent",
        "occurred_at": datetime.now(UTC).isoformat(),
        "payload": {
            "request_id": request_id,
            "trip_id": trip_id
        }
    }
    
    success = await user_core_client.post_event(event)
    if not success:
        raise ExternalServiceError("user-core")
    
    return {"status": "application sent", "request_id": request_id, "trip_id": trip_id}


@router.put("/trips/{trip_id}/applications/{request_id}", status_code=status.HTTP_200_OK)
async def respond_to_trip_application(
    trip_id: str,
    request_id: str,
    action: Literal['accept', 'decline'] = Body(..., embed=True),
    responder_id: str = Depends(get_current_user_id)
):
    """Respond to a trip application (trip owner only)."""
    
    # 記錄回應事件
    event = {
        "user_id": responder_id,
        "source_project": "snowbuddy-matching",
        "event_type": f"snowbuddy.trip.apply.{action}ed",
        "occurred_at": datetime.now(UTC).isoformat(),
        "payload": {
            "request_id": request_id,
            "trip_id": trip_id
        }
    }
    
    success = await user_core_client.post_event(event)
    if not success:
        raise ExternalServiceError("user-core")
    
    # 如果接受申請，建立 Calendar 事件
    if action == "accept":
        try:
            # 獲取申請者 ID
            behavior_service = BehaviorEventService()
            applicant_id = await behavior_service.get_applicant_id_from_request(request_id, trip_id)
            
            if applicant_id:
                trip_service = TripIntegrationService()
                participant = await trip_service.join_trip_with_calendar(trip_id, applicant_id)
                
                if participant:
                    return {
                        "status": f"application {action}ed",
                        "participant": TripParticipantResponse(
                            trip_id=participant.trip_id,
                            user_id=participant.user_id,
                            joined_at=participant.joined_at,
                            status=participant.status,
                            calendar_synced=participant.calendar_event_id is not None
                        )
                    }
            else:
                print(f"Could not find applicant for request {request_id}")
                
        except Exception as e:
            # Calendar 整合失敗不影響申請接受
            print(f"Calendar integration failed: {e}")
    
    return {"status": f"application {action}ed"}


@router.delete("/trips/{trip_id}/participants/{user_id}", status_code=status.HTTP_200_OK)
async def leave_trip(
    trip_id: str,
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Leave a trip (participant or trip owner can remove)."""
    
    # 簡單權限檢查：只能移除自己或者是 trip owner
    # TODO: 實際需要檢查 trip owner
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # 記錄離開事件
    event = {
        "user_id": current_user_id,
        "source_project": "snowbuddy-matching", 
        "event_type": "snowbuddy.trip.leave",
        "occurred_at": datetime.now(UTC).isoformat(),
        "payload": {
            "trip_id": trip_id,
            "user_id": user_id
        }
    }
    
    success = await user_core_client.post_event(event)
    if not success:
        raise ExternalServiceError("user-core")
    
    # 清理 Calendar 事件
    try:
        trip_service = TripIntegrationService()
        await trip_service.leave_trip_with_calendar(trip_id, user_id)
    except Exception as e:
        print(f"Calendar cleanup failed: {e}")
    
    return {"status": "left trip"}


@router.get("/trips/{trip_id}/participants")
async def get_trip_participants(
    trip_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """Get all participants of a trip."""
    # TODO: 實現參與者查詢
    # 需要從 BehaviorEvent 中查詢所有相關事件
    return {"participants": []}
