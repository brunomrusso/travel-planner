import httpx
from typing import List, Dict, Tuple, Any

class OSRMService:
    OSRM_API = "http://router.project-osrm.org/route/v1/driving"
    
    async def get_distance_and_time(self, lat1: float, lon1: float, lat2: float, lon2: float) -> Dict[str, Any]:
        try:
            url = f"{self.OSRM_API}/{lon1},{lat1};{lon2},{lat2}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("routes"):
                        route = data["routes"][0]
                        return {
                            "distance_km": route["distance"] / 1000,
                            "time_minutes": route["duration"] / 60,
                            "geometry": route.get("geometry")
                        }
        except Exception as e:
            print(f"Error getting distance from OSRM: {e}")
        
        return {
            "distance_km": 0,
            "time_minutes": 0,
            "geometry": None
        }
    
    async def optimize_route(self, coordinates: List[Tuple[float, float]]) -> Dict[str, Any]:
        if len(coordinates) < 2:
            return {"optimized_coordinates": coordinates, "total_distance_km": 0, "total_time_minutes": 0}
        
        try:
            coords_str = ";".join([f"{lon},{lat}" for lat, lon in coordinates])
            url = f"{self.OSRM_API}/{coords_str}?overview=full&steps=true"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("routes"):
                        route = data["routes"][0]
                        return {
                            "total_distance_km": route["distance"] / 1000,
                            "total_time_minutes": route["duration"] / 60,
                            "geometry": route.get("geometry"),
                            "waypoints": data.get("waypoints", [])
                        }
        except Exception as e:
            print(f"Error optimizing route with OSRM: {e}")
        
        return {
            "total_distance_km": 0,
            "total_time_minutes": 0,
            "geometry": None,
            "waypoints": []
        }
