from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import List, Optional
from app.models.attraction import Attraction, AttractionCreate
from app.database import get_supabase
from app.services.osm_service import OSMService

router = APIRouter(prefix="/attractions", tags=["attractions"])

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

@router.get("/", response_model=List[Attraction])
async def list_attractions(city: str, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        response = supabase.table("attractions").select("*").eq("city", city).execute()
        
        if not response.data:
            osm_service = OSMService()
            attractions = await osm_service.fetch_attractions(city)
            
            for attraction in attractions:
                try:
                    supabase.table("attractions").insert({
                        "osm_id": attraction.get("osm_id"),
                        "name": attraction["name"],
                        "category": attraction["category"],
                        "latitude": attraction["latitude"],
                        "longitude": attraction["longitude"],
                        "rating": attraction.get("rating", 0),
                        "visit_duration_minutes": attraction.get("visit_duration_minutes", 60),
                        "city": city
                    }).execute()
                except:
                    pass
            
            response = supabase.table("attractions").select("*").eq("city", city).execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{attraction_id}", response_model=Attraction)
async def get_attraction(attraction_id: str, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    try:
        response = supabase.table("attractions").select("*").eq("id", attraction_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attraction not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
