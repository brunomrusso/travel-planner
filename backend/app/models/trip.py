from pydantic import BaseModel
from datetime import date
from typing import Optional, List, Dict, Any
from uuid import UUID

class DestinationCity(BaseModel):
    city: str
    country: str = ""
    country_code: str = ""

class TripCreate(BaseModel):
    destination_city: str
    destinations: Optional[List[DestinationCity]] = []
    start_date: date
    end_date: date
    traveler_profile: str

class TripUpdate(BaseModel):
    destination_city: Optional[str] = None
    destinations: Optional[List[DestinationCity]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    traveler_profile: Optional[str] = None

class Trip(BaseModel):
    id: UUID
    user_id: UUID
    destination_city: str
    destinations: Optional[List[Dict[str, Any]]] = []
    start_date: date
    end_date: date
    traveler_profile: str
    created_at: str

    class Config:
        from_attributes = True
