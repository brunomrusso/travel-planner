from pydantic import BaseModel
from datetime import date
from typing import Optional
from uuid import UUID

class TripCreate(BaseModel):
    destination_city: str
    start_date: date
    end_date: date
    traveler_profile: str

class TripUpdate(BaseModel):
    destination_city: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    traveler_profile: Optional[str] = None

class Trip(BaseModel):
    id: UUID
    user_id: UUID
    destination_city: str
    start_date: date
    end_date: date
    traveler_profile: str
    created_at: str

    class Config:
        from_attributes = True
