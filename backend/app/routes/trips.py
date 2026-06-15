from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import List, Optional
from uuid import UUID
from app.models.trip import Trip, TripCreate, TripUpdate
from app.database import get_supabase
from app.services.itinerary_optimizer import ItineraryOptimizer

router = APIRouter(prefix="/trips", tags=["trips"])

def get_user_id_from_token(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        token = authorization.split(" ")[1]
        supabase = get_supabase()
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

@router.get("/", response_model=List[Trip])
async def list_trips(user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        response = supabase.table("trips").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/", response_model=Trip)
async def create_trip(trip: TripCreate, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        response = supabase.table("trips").insert({
            "user_id": user_id,
            "destination_city": trip.destination_city,
            "start_date": trip.start_date.isoformat(),
            "end_date": trip.end_date.isoformat(),
            "traveler_profile": trip.traveler_profile
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{trip_id}", response_model=Trip)
async def get_trip(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        response = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/{trip_id}", response_model=Trip)
async def update_trip(trip_id: UUID, trip: TripUpdate, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        update_data = trip.model_dump(exclude_unset=True)
        if "start_date" in update_data:
            update_data["start_date"] = update_data["start_date"].isoformat()
        if "end_date" in update_data:
            update_data["end_date"] = update_data["end_date"].isoformat()
        
        response = supabase.table("trips").update(update_data).eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{trip_id}")
async def delete_trip(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        supabase.table("trips").delete().eq("id", str(trip_id)).eq("user_id", user_id).execute()
        return {"message": "Trip deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/{trip_id}/generate-itinerary")
async def generate_itinerary(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_response = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        
        trip = trip_response.data[0]
        optimizer = ItineraryOptimizer(supabase)
        itinerary = await optimizer.generate_itinerary(trip_id, trip)
        
        return {"message": "Itinerary generated successfully", "itinerary": itinerary}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
