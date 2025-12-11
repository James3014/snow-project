"""
Trip Participant Model for Calendar Integration
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field


class TripParticipant(BaseModel):
    """Trip participant with calendar integration"""
    trip_id: str
    user_id: str
    joined_at: datetime = Field(default_factory=datetime.now)
    status: Literal["confirmed", "cancelled"] = "confirmed"
    calendar_event_id: Optional[str] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TripParticipantCreate(BaseModel):
    """Create trip participant request"""
    trip_id: str
    user_id: str


class TripParticipantResponse(BaseModel):
    """Trip participant response"""
    trip_id: str
    user_id: str
    joined_at: datetime
    status: str
    calendar_synced: bool = False
