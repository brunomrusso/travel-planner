from typing import List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
from app.services.osrm_service import OSRMService
from collections import defaultdict
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
    
    def _merge_profile_weights(self, profiles_str: str) -> Dict[str, int]:
        profile_keys = [p.strip().lower() for p in (profiles_str or "").split(",") if p.strip()]
        if not profile_keys:
            profile_keys = ["cultural"]

        merged: Dict[str, int] = {}
        for key in profile_keys:
            weights = self.TRAVELER_PROFILES.get(key)
            if not weights:
                continue
            for category, weight in weights.items():
                merged[category] = max(merged.get(category, 0), weight)

        return merged or self.TRAVELER_PROFILES["cultural"]

    async def generate_itinerary(self, trip_id: UUID, trip: Dict[str, Any]) -> List[Dict[str, Any]]:
        weights = self._merge_profile_weights(trip.get("traveler_profile", "cultural"))

        start_date = datetime.fromisoformat(trip["start_date"])
        end_date = datetime.fromisoformat(trip["end_date"])
        num_days = (end_date - start_date).days + 1

        destinations = trip.get("destinations") or []
        if not destinations:
            destinations = [{"city": trip["destination_city"]}]

        all_itinerary: List[Dict[str, Any]] = []
        days_per_city = max(1, num_days // len(destinations))

        for city_idx, dest in enumerate(destinations):
            city = dest["city"]
            is_last = city_idx == len(destinations) - 1
            city_start_day = city_idx * days_per_city + 1
            city_end_day = num_days if is_last else (city_idx + 1) * days_per_city
            city_days = city_end_day - city_start_day + 1

            resp = self.supabase.table("attractions").select("*").eq("city", city).execute()
            attractions = resp.data
            if not attractions:
                continue

            scored = self._score_attractions(attractions, weights)
            city_itinerary = self._distribute_attractions_by_day(scored, city_days)

            # Offset day numbers to global trip days
            for item in city_itinerary:
                item["day_number"] += city_start_day - 1

            all_itinerary.extend(city_itinerary)

        if not all_itinerary:
            return []

        all_itinerary = await self._optimize_daily_routes(all_itinerary)
        all_itinerary = self._assign_times(all_itinerary)
        self._save_itinerary_to_db(trip_id, all_itinerary)
        return all_itinerary
    
    def _score_attractions(self, attractions: List[Dict[str, Any]], weights: Dict[str, int]) -> List[Dict[str, Any]]:
        scored = []
        for attraction in attractions:
            category = attraction.get("category", "").lower()
            score = weights.get(category, 1)
            attraction["score"] = score
            scored.append(attraction)
        
        return sorted(scored, key=lambda x: x["score"], reverse=True)
    
    def _distribute_attractions_by_day(self, attractions: List[Dict[str, Any]], num_days: int) -> List[Dict[str, Any]]:
        if not attractions or num_days <= 0:
            return []

        itinerary = []
        day_order = defaultdict(int)

        # Round-robin: attraction i goes to day (i % num_days) + 1
        # Correctly handles cases where len(attractions) < num_days
        for i, attraction in enumerate(attractions):
            day_number = (i % num_days) + 1
            day_order[day_number] += 1
            itinerary.append({
                "day_number": day_number,
                "order_in_day": day_order[day_number],
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
    
    def _assign_times(self, itinerary: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Assign realistic start times per day, starting at 09:00, accounting for
        visit duration, travel time between attractions, and a lunch break."""
        days = defaultdict(list)
        for item in itinerary:
            days[item["day_number"]].append(item)

        for day, items in days.items():
            items.sort(key=lambda x: x["order_in_day"])
            current = datetime(2000, 1, 1, 9, 0)  # day starts at 09:00
            had_lunch = False
            prev_coord = None

            for item in items:
                attr = item["attraction"]
                coord = (attr["latitude"], attr["longitude"])

                if prev_coord is not None:
                    dist = self._distance(prev_coord, coord)
                    transport = self._get_transport(dist)
                    travel_min = round((dist / transport["speed_kmh"]) * 60)
                    current += timedelta(minutes=travel_min)

                # Lunch break (~1h) once, when we reach midday
                if not had_lunch and 12 <= current.hour < 15:
                    current += timedelta(minutes=60)
                    had_lunch = True

                item["start_time"] = current.strftime("%H:%M:%S")
                current += timedelta(minutes=attr.get("visit_duration_minutes", 60))
                prev_coord = coord

        return itinerary

    def _get_transport(self, distance_km: float) -> Dict[str, Any]:
        """Return best transport mode and estimated travel time for a given distance."""
        if distance_km < 1.0:
            return {"mode": "walking", "label": "A pé", "icon": "🚶", "speed_kmh": 5}
        elif distance_km < 3.5:
            return {"mode": "transit", "label": "Transporte público", "icon": "🚌", "speed_kmh": 20}
        else:
            return {"mode": "taxi", "label": "Táxi / Uber", "icon": "🚕", "speed_kmh": 25}

    def _save_itinerary_to_db(self, trip_id: UUID, itinerary: List[Dict[str, Any]]):
        # Delete any existing itinerary for this trip before saving
        self.supabase.table("itineraries").delete().eq("trip_id", str(trip_id)).execute()

        for item in itinerary:
            self.supabase.table("itineraries").insert({
                "trip_id": str(trip_id),
                "attraction_id": item["attraction"]["id"],
                "day_number": item["day_number"],
                "order_in_day": item["order_in_day"],
                "start_time": item.get("start_time"),
                "notes": item.get("notes", "")
            }).execute()
