from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import List, Optional
from uuid import UUID
from app.models.trip import Trip, TripCreate, TripUpdate
from app.database import get_supabase
from app.services.itinerary_optimizer import ItineraryOptimizer
from app.services.osm_service import OSMService
from app.services.sample_attractions import get_sample_attractions

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
        destinations = [d.model_dump() for d in (trip.destinations or [])]
        if not destinations:
            destinations = [{"city": trip.destination_city, "country": "", "country_code": ""}]

        base_data = {
            "user_id": user_id,
            "destination_city": trip.destination_city,
            "start_date": trip.start_date.isoformat(),
            "end_date": trip.end_date.isoformat(),
            "traveler_profile": trip.traveler_profile,
        }

        try:
            # Try with destinations column (requires migration)
            response = supabase.table("trips").insert({**base_data, "destinations": destinations}).execute()
        except Exception:
            # Column doesn't exist yet — insert without it
            response = supabase.table("trips").insert(base_data).execute()

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

async def _ensure_attractions_for_city(city: str, supabase) -> int:
    check = supabase.table("attractions").select("id").eq("city", city).limit(1).execute()
    if check.data:
        return 0
    print(f"No attractions for '{city}', fetching...")
    osm_service = OSMService()
    osm_attrs = await osm_service.fetch_attractions(city)
    if not osm_attrs:
        print(f"OSM unavailable, using sample data for '{city}'")
        osm_attrs = get_sample_attractions(city)
    saved = 0
    for attr in osm_attrs:
        try:
            supabase.table("attractions").insert({
                "osm_id": attr.get("osm_id"),
                "name": attr["name"],
                "category": attr["category"],
                "latitude": attr["latitude"],
                "longitude": attr["longitude"],
                "rating": attr.get("rating", 0),
                "visit_duration_minutes": attr.get("visit_duration_minutes", 60),
                "city": city
            }).execute()
            saved += 1
        except Exception:
            pass
    print(f"Saved {saved} attractions for '{city}'")
    return saved

@router.post("/{trip_id}/generate-itinerary")
async def generate_itinerary(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_response = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

        trip = trip_response.data[0]
        destinations = trip.get("destinations") or []
        if not destinations:
            destinations = [{"city": trip["destination_city"], "country": "", "country_code": ""}]

        # Ensure attractions exist for ALL cities
        for dest in destinations:
            await _ensure_attractions_for_city(dest["city"], supabase)

        optimizer = ItineraryOptimizer(supabase)
        itinerary = await optimizer.generate_itinerary(trip_id, trip)

        if not itinerary:
            cities = ", ".join(d["city"] for d in destinations)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Não foi possível gerar roteiro: nenhuma atração encontrada para {cities}. Tente novamente."
            )

        return {"message": "Itinerary generated successfully", "itinerary": itinerary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
