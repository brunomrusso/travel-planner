from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import time

class ItineraryItemCreate(BaseModel):
    attraction_id: UUID
    day_number: int
    order_in_day: int
    start_time: Optional[time] = None
    notes: Optional[str] = None

class ItineraryItemUpdate(BaseModel):
    day_number: Optional[int] = None
    order_in_day: Optional[int] = None
    start_time: Optional[time] = None
    notes: Optional[str] = None

class ItineraryItem(BaseModel):
    id: UUID
    trip_id: UUID
    attraction_id: UUID
    day_number: int
    order_in_day: int
    start_time: Optional[time]
    notes: Optional[str]
    created_at: str

    class Config:
        from_attributes = True
