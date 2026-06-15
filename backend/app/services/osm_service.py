import httpx
from typing import List, Dict, Any
import asyncio

class OSMService:
    OVERPASS_API = "https://overpass-api.de/api/interpreter"
    
    CATEGORY_MAPPING = {
        "restaurant": ["amenity=restaurant", "amenity=cafe", "amenity=fast_food"],
        "museum": ["tourism=museum"],
        "park": ["leisure=park", "leisure=garden"],
        "historic": ["historic=monument", "historic=castle", "historic=ruins"],
        "entertainment": ["amenity=cinema", "amenity=theatre", "tourism=attraction"],
        "beach": ["natural=beach"],
        "spa": ["amenity=spa", "amenity=sauna"],
        "zoo": ["tourism=zoo"],
        "market": ["amenity=marketplace", "shop=supermarket"],
        "gallery": ["tourism=gallery"],
    }
    
    VISIT_DURATION = {
        "restaurant": 90,
        "museum": 120,
        "park": 60,
        "historic": 45,
        "entertainment": 120,
        "beach": 120,
        "spa": 90,
        "zoo": 180,
        "market": 45,
        "gallery": 90,
    }
    
    async def fetch_attractions(self, city: str) -> List[Dict[str, Any]]:
        attractions = []
        
        for category, tags in self.CATEGORY_MAPPING.items():
            for tag in tags:
                try:
                    query = f"""
                    [bbox:0,0,0,0];
                    (
                        node[{tag}](area.searchArea);
                        way[{tag}](area.searchArea);
                    );
                    out center;
                    """
                    
                    geocoded = await self._geocode_city(city)
                    if not geocoded:
                        continue
                    
                    bbox = geocoded["bbox"]
                    query = f"""
                    [bbox:{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}];
                    (
                        node[{tag}];
                        way[{tag}];
                    );
                    out center;
                    """
                    
                    async with httpx.AsyncClient() as client:
                        response = await client.post(self.OVERPASS_API, data=query, timeout=30.0)
                        
                        if response.status_code == 200:
                            data = response.json()
                            for element in data.get("elements", []):
                                if "tags" in element and "name" in element["tags"]:
                                    lat = element.get("lat") or element.get("center", {}).get("lat")
                                    lon = element.get("lon") or element.get("center", {}).get("lon")
                                    
                                    if lat and lon:
                                        attractions.append({
                                            "osm_id": element.get("id"),
                                            "name": element["tags"]["name"],
                                            "category": category,
                                            "latitude": lat,
                                            "longitude": lon,
                                            "rating": 4.0,
                                            "visit_duration_minutes": self.VISIT_DURATION.get(category, 60)
                                        })
                except Exception as e:
                    print(f"Error fetching {category} from {tag}: {e}")
                    continue
        
        return attractions[:50]
    
    async def _geocode_city(self, city: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": city, "format": "json", "limit": 1},
                    timeout=10.0,
                    headers={"User-Agent": "TravelPlanner/1.0"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        result = data[0]
                        bbox = list(map(float, result["boundingbox"]))
                        return {
                            "lat": float(result["lat"]),
                            "lon": float(result["lon"]),
                            "bbox": [bbox[2], bbox[0], bbox[3], bbox[1]]
                        }
        except Exception as e:
            print(f"Error geocoding city {city}: {e}")
        
        return None
