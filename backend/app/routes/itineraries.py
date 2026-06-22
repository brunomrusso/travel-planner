from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from pydantic import BaseModel
from app.models.itinerary import ItineraryItem, ItineraryItemCreate, ItineraryItemUpdate
from app.database import get_supabase
from app.auth import get_user_id_from_token


class ReorderItem(BaseModel):
    id: str
    day_number: int
    order_in_day: int

router = APIRouter(prefix="/itineraries", tags=["itineraries"])

@router.get("/{trip_id}", response_model=List[ItineraryItem])
async def get_itinerary(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_response = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
        response = supabase.table("itineraries").select("*").eq("trip_id", str(trip_id)).order("day_number", desc=False).order("order_in_day", desc=False).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{trip_id}", response_model=ItineraryItem)
async def add_itinerary_item(trip_id: UUID, item: ItineraryItemCreate, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_response = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
        response = supabase.table("itineraries").insert({
            "trip_id": str(trip_id),
            "attraction_id": str(item.attraction_id),
            "day_number": item.day_number,
            "order_in_day": item.order_in_day,
            "start_time": item.start_time.isoformat() if item.start_time else None,
            "notes": item.notes
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{trip_id}")
async def update_itinerary(trip_id: UUID, items: List[ItineraryItemUpdate], user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_response = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
        supabase.table("itineraries").delete().eq("trip_id", str(trip_id)).execute()
        
        for item in items:
            update_data = item.model_dump(exclude_unset=True)
            if "start_time" in update_data and update_data["start_time"]:
                update_data["start_time"] = update_data["start_time"].isoformat()
            supabase.table("itineraries").insert(update_data).execute()
        
        return {"message": "Itinerary updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/{trip_id}/reorder")
async def reorder_itinerary(trip_id: UUID, updates: List[ReorderItem], user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_response = supabase.table("trips").select("id").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

        for upd in updates:
            supabase.table("itineraries").update({
                "day_number": upd.day_number,
                "order_in_day": upd.order_in_day,
            }).eq("id", upd.id).eq("trip_id", str(trip_id)).execute()

        return {"message": "Reordered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
