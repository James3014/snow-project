"""
Ski history domain models.
"""
from pydantic import BaseModel
from datetime import date, datetime


class SkiHistoryCreate(BaseModel):
    resort_id: str
    date: date


class BehaviorEventPayload(BaseModel):
    resort_id: str
    date: date


class BehaviorEventCreate(BaseModel):
    user_id: str
    source_project: str = "resort-services"
    event_type: str = "resort.visited"
    payload: BehaviorEventPayload
    occurred_at: datetime
