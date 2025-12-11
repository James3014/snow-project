from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SkiPreferenceBase(BaseModel):
    resort_ids: List[str] = Field(default_factory=list, description="Unique resort IDs the user is interested in")
    source: str = Field(default="trip_planner", description="Source system of the sync (e.g. trip_planner)")
    last_trip_id: Optional[UUID] = Field(default=None, description="Trip ID that triggered the latest sync")


class SkiPreferenceCreate(SkiPreferenceBase):
    pass


class SkiPreferenceResponse(SkiPreferenceBase):
    user_id: UUID
    last_synced_at: datetime

    class Config:
        orm_mode = True
