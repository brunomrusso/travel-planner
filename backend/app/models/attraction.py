from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class AttractionCreate(BaseModel):
    osm_id: Optional[int] = None
    name: str
    category: str
    latitude: float
    longitude: float
    rating: Optional[float] = 0
    visit_duration_minutes: Optional[int] = 60
    city: str

class Attraction(BaseModel):
    id: UUID
    osm_id: Optional[int]
    name: str
    category: str
    latitude: float
    longitude: float
    rating: float
    visit_duration_minutes: int
    city: str
    created_at: str

    class Config:
        from_attributes = True
