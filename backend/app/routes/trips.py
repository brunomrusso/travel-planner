from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import List, Optional, Dict, Any
from uuid import UUID
import uuid as _uuid
from datetime import datetime
import statistics
from pydantic import BaseModel
from app.models.trip import Trip, TripCreate, TripUpdate
from app.database import get_supabase
from app.services.itinerary_optimizer import ItineraryOptimizer
from app.services.attractions_fetcher import enrich_city_attractions, _geocode_city
from app.services.weather_service import WeatherService
from app.auth import get_user_id_from_token

class AddDayTripBody(BaseModel):
    city: str
    day_number: int
    max_attractions: int = 4
    highlights: Optional[List[str]] = None  # used as fallback if OSM returns nothing

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
    """Ensure at least 10 attractions exist for the city using the efficient single-query fetcher."""
    return await enrich_city_attractions(supabase, city, min_needed=10)


@router.patch("/{trip_id}/settings")
async def patch_trip_settings(
    trip_id: UUID,
    partial: Dict[str, Any] = Body(...),
    user_id: str = Depends(get_user_id_from_token),
):
    """Merge partial settings into trip_settings JSONB column."""
    supabase = get_supabase()
    try:
        resp = supabase.table("trips").select("trip_settings").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        current = resp.data[0].get("trip_settings") or {}
        merged = {**current, **partial}
        supabase.table("trips").update({"trip_settings": merged}).eq("id", str(trip_id)).eq("user_id", user_id).execute()
        return merged
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


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

@router.get("/{trip_id}/weather")
async def get_trip_weather(trip_id: UUID, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        trip_resp = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
        trip = trip_resp.data[0]
        city = (trip.get("destinations") or [{}])[0].get("city") or trip["destination_city"]
        start = datetime.fromisoformat(trip["start_date"]).date()
        end = datetime.fromisoformat(trip["end_date"]).date()
        weather_svc = WeatherService()
        forecast = await weather_svc.get_forecast(city, start, end)
        return forecast
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

        # Fetch weather forecast to enable weather-aware scheduling
        weather_data = []
        try:
            city = destinations[0]["city"]
            start = datetime.fromisoformat(trip["start_date"]).date()
            end = datetime.fromisoformat(trip["end_date"]).date()
            weather_svc = WeatherService()
            weather_data = await weather_svc.get_forecast(city, start, end)
        except Exception:
            pass

        optimizer = ItineraryOptimizer(supabase)
        itinerary = await optimizer.generate_itinerary(trip_id, trip, weather_data)

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


@router.post("/{trip_id}/add-day-trip")
async def add_day_trip(trip_id: UUID, body: AddDayTripBody, user_id: str = Depends(get_user_id_from_token)):
    """Add a day trip city's attractions to a specific day of the itinerary."""
    supabase = get_supabase()
    try:
        # Verify trip ownership
        trip_resp = supabase.table("trips").select("*").eq("id", str(trip_id)).eq("user_id", user_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=404, detail="Trip not found")

        # Ensure attractions exist for the day trip city (fetch from OSM if needed)
        await _ensure_attractions_for_city(body.city, supabase)

        # IDs already in this itinerary — avoid duplicates
        existing_itin = supabase.table("itineraries").select("attraction_id").eq("trip_id", str(trip_id)).execute()
        existing_ids = {item["attraction_id"] for item in (existing_itin.data or [])}

        # Fetch all attractions for the day trip city
        attrs_resp = supabase.table("attractions").select("*").eq("city", body.city).execute()
        all_attrs = attrs_resp.data or []
        available = [a for a in all_attrs if a["id"] not in existing_ids]

        # Fallback: if OSM returned nothing, synthesise attractions from the highlights list
        if not available and body.highlights:
            coords = await _geocode_city(body.city)
            if coords:
                base_lat, base_lon = coords
                # Small offsets so each highlight gets a slightly different coordinate
                offsets = [0.0, 0.004, -0.004, 0.008, -0.008, 0.006, -0.006]
                synthesised = []
                for idx, name in enumerate(body.highlights[: body.max_attractions]):
                    offset = offsets[idx % len(offsets)]
                    row = {
                        "name": name,
                        "category": "historic",
                        "city": body.city,
                        "latitude": base_lat + offset,
                        "longitude": base_lon + offset,
                        "visit_duration_minutes": 90,
                        "rating": 4.5,
                    }
                    try:
                        ins = supabase.table("attractions").insert(row).execute()
                        if ins.data:
                            synthesised.append(ins.data[0])
                    except Exception:
                        pass
                available = synthesised

        if not available:
            raise HTTPException(
                status_code=404,
                detail=f"N\u00e3o foi poss\u00edvel encontrar atra\u00e7\u00f5es para {body.city}. Verifique o nome da cidade e tente novamente."
            )

        # Smart geographic selection: nearest-neighbor from centroid
        if len(available) > 1:
            center_lat = statistics.mean(a["latitude"] for a in available)
            center_lon = statistics.mean(a["longitude"] for a in available)
            pool = list(available)
            selected: list = []
            cur_lat, cur_lon = center_lat, center_lon
            while pool and len(selected) < body.max_attractions:
                nearest = min(pool, key=lambda a: (a["latitude"] - cur_lat) ** 2 + (a["longitude"] - cur_lon) ** 2)
                selected.append(nearest)
                pool.remove(nearest)
                cur_lat, cur_lon = nearest["latitude"], nearest["longitude"]
        else:
            selected = available[: body.max_attractions]

        # Current max order_in_day for target day
        day_resp = supabase.table("itineraries").select("order_in_day").eq("trip_id", str(trip_id)).eq("day_number", body.day_number).execute()
        max_order = max((item["order_in_day"] for item in (day_resp.data or [])), default=0)

        # Insert each attraction into the itinerary
        inserted = []
        for i, attr in enumerate(selected):
            item = {
                "id": str(_uuid.uuid4()),
                "trip_id": str(trip_id),
                "attraction_id": attr["id"],
                "day_number": body.day_number,
                "order_in_day": max_order + i + 1,
            }
            resp = supabase.table("itineraries").insert(item).execute()
            if resp.data:
                inserted.append(resp.data[0])

        return {"added": inserted, "attractions": selected}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
