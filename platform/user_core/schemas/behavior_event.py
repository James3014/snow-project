from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, UUID4, HttpUrl

class BehaviorEventBase(BaseModel):
    source_project: str
    event_type: str
    payload: Dict[str, Any]
    version: int = 1
    schema_url: Optional[HttpUrl] = None
    occurred_at: datetime

class BehaviorEventCreate(BehaviorEventBase):
    user_id: UUID4

class BehaviorEvent(BehaviorEventBase):
    event_id: UUID4
    user_id: UUID4
    recorded_at: datetime

    model_config = {"from_attributes": True}


class EventSortField(str, Enum):
    occurred_at = "occurred_at"
    recorded_at = "recorded_at"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"
