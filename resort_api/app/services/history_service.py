"""
History service - handles ski history recording logic.
"""
from datetime import datetime, time, UTC
import httpx

from ..models import SkiHistoryCreate, BehaviorEventCreate, BehaviorEventPayload
from ..config import get_settings
from ..exceptions import ExternalServiceError


class HistoryService:
    """Service for ski history operations."""
    
    async def record_visit(self, user_id: str, history: SkiHistoryCreate) -> None:
        """Record a ski visit by forwarding to user-core service."""
        settings = get_settings()
        
        event = BehaviorEventCreate(
            user_id=user_id,
            payload=BehaviorEventPayload(
                resort_id=history.resort_id,
                date=history.date
            ),
            occurred_at=datetime.combine(history.date, time.min, tzinfo=UTC),
        )
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.user_core_api_url,
                    json=event.model_dump(mode="json")
                )
                response.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise ExternalServiceError(
                service="user-core",
                detail=f"returned error {e.response.status_code}: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise ExternalServiceError(service="user-core", detail=str(e))
