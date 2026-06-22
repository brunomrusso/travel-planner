from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from app.models.trip import Trip, TripCreate, TripUpdate
from app.database import get_supabase
from app.services.itinerary_optimizer import ItineraryOptimizer
from app.services.osm_service import OSMService
from app.services.sample_attractions import get_sample_attractions
from app.auth import get_user_id_from_token

router = APIRouter(prefix="/trips", tags=["trips"])

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

@router.patch("/{trip_id}/complete")
async def complete_trip(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_resp = supabase.table("trips").select("id").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        supabase.table("trips").update({"status": "completed"}).eq("id", str(trip_id)).execute()
        return {"message": "Trip marked as completed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{trip_id}/share")
async def get_shared_trip(trip_id: UUID):
    supabase = get_supabase()
    try:
        trip_resp = supabase.table("trips").select("*").eq("id", str(trip_id)).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        trip = trip_resp.data[0]
        itin_resp = (
            supabase.table("itineraries").select("*")
            .eq("trip_id", str(trip_id))
            .order("day_number", desc=False)
            .order("order_in_day", desc=False)
            .execute()
        )
        itinerary = itin_resp.data or []
        attr_ids = list({item["attraction_id"] for item in itinerary if item.get("attraction_id")})
        attractions: list = []
        if attr_ids:
            attrs_resp = supabase.table("attractions").select("*").in_("id", attr_ids).execute()
            attractions = attrs_resp.data or []
        return {"trip": trip, "itinerary": itinerary, "attractions": attractions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{trip_id}/available-attractions")
async def get_available_attractions(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_resp = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        trip = trip_resp.data[0]
        destinations = trip.get("destinations") or [{"city": trip["destination_city"]}]
        all_attrs: list = []
        for dest in destinations:
            resp = supabase.table("attractions").select("*").eq("city", dest["city"]).execute()
            all_attrs.extend(resp.data or [])
        itin_resp = supabase.table("itineraries").select("attraction_id").eq("trip_id", str(trip_id)).execute()
        in_itin = {item["attraction_id"] for item in (itin_resp.data or [])}
        return [a for a in all_attrs if a["id"] not in in_itin]
    except HTTPException:
        raise
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
