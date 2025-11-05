from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import date, datetime

class Names(BaseModel):
    zh: Optional[str] = None
    en: Optional[str] = None
    ja: Optional[str] = None

class Coordinates(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None

class Season(BaseModel):
    estimated_open: Optional[date] = None
    estimated_close: Optional[date] = None
    season_notes: Optional[str] = None

class Description(BaseModel):
    highlights: Optional[List[str]] = []
    tagline: Optional[str] = None
    resort_type: Optional[str] = None
    snow_quality: Optional[str] = None

class Amenities(BaseModel):
    general: Optional[List[str]] = []
    kids_facilities: Optional[bool] = None
    onsen_availability: Optional[bool] = None

class SnowStats(BaseModel):
    lifts: Optional[int] = None
    courses_total: Optional[int] = None
    beginner_ratio: Optional[float] = None
    intermediate_ratio: Optional[float] = None
    advanced_ratio: Optional[float] = None
    longest_run: Optional[float] = None
    vertical_drop: Optional[int] = None
    elevation_range: Optional[str] = None
    park_features: Optional[List[str]] = []
    night_ski: Optional[bool] = False
    notes: Optional[str] = None

class Course(BaseModel):
    name: str
    level: Literal['beginner', 'intermediate', 'advanced']
    tags: Optional[List[str]] = []
    length: Optional[float] = None
    elevation_diff: Optional[int] = None
    avg_slope: Optional[float] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class TicketType(BaseModel):
    type: str
    adult: Optional[int] = None
    student: Optional[int] = None
    child: Optional[int] = None
    senior: Optional[int] = None
    notes: Optional[str] = None

class Pricing(BaseModel):
    last_verified: Optional[date] = None
    ticket_types: List[TicketType] = []

class RentalItem(BaseModel):
    item: str
    adult_price: Optional[int] = None
    child_price: Optional[int] = None
    notes: Optional[str] = None

class Rental(BaseModel):
    last_verified: Optional[date] = None
    items: List[RentalItem] = []
    notes: Optional[str] = None

class TransportationDetail(BaseModel):
    # Using Field alias to allow 'from' as a field name
    from_location: Optional[str] = Field(None, alias='from')
    to: Optional[str] = None
    route: Optional[str] = None # For bus/drive
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class DomesticTransportation(BaseModel):
    shinkansen: Optional[List[TransportationDetail]] = []
    bus: Optional[List[TransportationDetail]] = []
    self_drive: Optional[List[TransportationDetail]] = []
    train: Optional[List[TransportationDetail]] = []

class InternationalTransportation(BaseModel):
    airports: Optional[List[dict]] = [] # Simplified for now

class Transportation(BaseModel):
    domestic: Optional[DomesticTransportation] = None
    international: Optional[InternationalTransportation] = None
    remarks: Optional[str] = None

class Resort(BaseModel):
    resort_id: str
    names: Names
    country_code: str
    region: str
    timezone: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    season: Optional[Season] = None
    official_site: Optional[str] = None
    description: Optional[Description] = None
    amenities: Optional[List[str]] = []
    snow_stats: Optional[SnowStats] = None
    courses: Optional[List[Course]] = []
    pricing: Optional[Pricing] = None
    rental: Optional[Rental] = None
    transportation: Optional[Transportation] = None
    content_sources: Optional[List[str]] = []
    notes: Optional[str] = None

class ResortSummary(BaseModel):
    resort_id: str
    names: Names
    region: str
    country_code: str
    tagline: Optional[str] = None

class ResortList(BaseModel):
    total: int
    limit: int
    offset: int
    items: List[ResortSummary]

# --- Models for Ski History --- #

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
