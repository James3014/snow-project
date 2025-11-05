from typing import Optional
from datetime import datetime
from pydantic import BaseModel, UUID4
from models.enums import NotificationStatus, NotificationFrequency

class NotificationPreferenceBase(BaseModel):
    channel: str
    topic: str
    status: NotificationStatus
    frequency: NotificationFrequency = NotificationFrequency.immediate
    audited_by: Optional[str] = None
    consent_source: Optional[str] = None
    consent_recorded_at: Optional[datetime] = None

class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass

class NotificationPreference(NotificationPreferenceBase):
    user_id: UUID4
    last_updated_at: datetime

    model_config = {"from_attributes": True}
