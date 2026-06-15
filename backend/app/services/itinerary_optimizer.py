from typing import List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
from app.services.osrm_service import OSRMService
import math

class ItineraryOptimizer:
    TRAVELER_PROFILES = {
        "adventure": {"hiking": 5, "nature": 5, "park": 4, "museum": 1, "restaurant": 2},
        "cultural": {"museum": 5, "gallery": 5, "historic": 4, "park": 2, "restaurant": 3},
        "gastronomic": {"restaurant": 5, "cafe": 4, "bar": 4, "market": 3, "museum": 2},
        "relax": {"spa": 5, "beach": 5, "park": 4, "restaurant": 3, "museum": 1},
        "family": {"park": 5, "zoo": 4, "museum": 3, "restaurant": 4, "entertainment": 4}
    }
    
    def __init__(self, supabase):
        self.supabase = supabase
        self.osrm_service = OSRMService()
    
    async def generate_itinerary(self, trip_id: UUID, trip: Dict[str, Any]) -> List[Dict[str, Any]]:
        attractions_response = self.supabase.table("attractions").select("*").eq("city", trip["destination_city"]).execute()
        attractions = attractions_response.data
        
        if not attractions:
            return []
        
        profile = trip.get("traveler_profile", "cultural").lower()
        weights = self.TRAVELER_PROFILES.get(profile, self.TRAVELER_PROFILES["cultural"])
        
        scored_attractions = self._score_attractions(attractions, weights)
        
        start_date = datetime.fromisoformat(trip["start_date"])
        end_date = datetime.fromisoformat(trip["end_date"])
        num_days = (end_date - start_date).days + 1
        
        itinerary = self._distribute_attractions_by_day(scored_attractions, num_days)
        
        itinerary = await self._optimize_daily_routes(itinerary)
        
        self._save_itinerary_to_db(trip_id, itinerary)
        
        return itinerary
    
    def _score_attractions(self, attractions: List[Dict[str, Any]], weights: Dict[str, int]) -> List[Dict[str, Any]]:
        scored = []
        for attraction in attractions:
            category = attraction.get("category", "").lower()
            score = weights.get(category, 1)
            attraction["score"] = score
            scored.append(attraction)
        
        return sorted(scored, key=lambda x: x["score"], reverse=True)
    
    def _distribute_attractions_by_day(self, attractions: List[Dict[str, Any]], num_days: int) -> List[Dict[str, Any]]:
        itinerary = []
        attractions_per_day = len(attractions) // num_days if num_days > 0 else 0
        
        for day in range(1, num_days + 1):
            start_idx = (day - 1) * attractions_per_day
            end_idx = start_idx + attractions_per_day if day < num_days else len(attractions)
            
            day_attractions = attractions[start_idx:end_idx]
            
            for order, attraction in enumerate(day_attractions, 1):
                itinerary.append({
                    "day_number": day,
                    "order_in_day": order,
                    "attraction": attraction,
                    "start_time": None,
                    "notes": ""
                })
        
        return itinerary
    
    async def _optimize_daily_routes(self, itinerary: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        days = {}
        for item in itinerary:
            day = item["day_number"]
            if day not in days:
                days[day] = []
            days[day].append(item)
        
        optimized = []
        for day, items in sorted(days.items()):
            if len(items) <= 1:
                optimized.extend(items)
                continue
            
            coordinates = [(item["attraction"]["latitude"], item["attraction"]["longitude"]) for item in items]
            
            optimized_coords = self._nearest_neighbor_tsp(coordinates)
            
            for order, coord_idx in enumerate(optimized_coords, 1):
                item = items[coord_idx]
                item["order_in_day"] = order
                optimized.append(item)
        
        return optimized
    
    def _nearest_neighbor_tsp(self, coordinates: List[tuple]) -> List[int]:
        if not coordinates:
            return []
        
        n = len(coordinates)
        unvisited = set(range(n))
        current = 0
        path = [current]
        unvisited.remove(current)
        
        while unvisited:
            nearest = min(unvisited, key=lambda x: self._distance(coordinates[current], coordinates[x]))
            path.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        
        return path
    
    def _distance(self, coord1: tuple, coord2: tuple) -> float:
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _save_itinerary_to_db(self, trip_id: UUID, itinerary: List[Dict[str, Any]]):
        for item in itinerary:
            self.supabase.table("itineraries").insert({
                "trip_id": str(trip_id),
                "attraction_id": item["attraction"]["id"],
                "day_number": item["day_number"],
                "order_in_day": item["order_in_day"],
                "start_time": item.get("start_time"),
                "notes": item.get("notes", "")
            }).execute()
