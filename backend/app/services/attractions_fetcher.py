"""
Fetches tourist attractions from OpenStreetMap via Overpass API.
Used to enrich sparse cities before itinerary generation.
No API key required.
"""
import httpx
from typing import List, Dict, Any, Optional, Tuple


def _map_osm_tags(tags: dict) -> Tuple[str, int]:
    """Map OSM tags to our category + estimated visit duration (minutes)."""
    tourism = tags.get("tourism", "")
    amenity = tags.get("amenity", "")
    leisure = tags.get("leisure", "")
    historic = tags.get("historic", "")
    natural = tags.get("natural", "")

    if tourism == "museum":          return "museum", 120
    if tourism == "gallery":         return "gallery", 60
    if tourism in ("zoo", "aquarium"): return "zoo", 150
    if tourism == "theme_park":      return "entertainment", 240
    if tourism in ("attraction", "viewpoint", "artwork", "monument"): return "historic", 75
    if amenity == "restaurant":      return "restaurant", 60
    if amenity == "cafe":            return "restaurant", 45
    if amenity == "spa":             return "spa", 90
    if leisure in ("park", "garden", "botanical_garden"): return "park", 90
    if leisure == "nature_reserve":  return "park", 120
    if historic in ("castle", "fort", "fortification"): return "historic", 90
    if historic in ("monument", "memorial", "ruins"): return "historic", 45
    if natural == "beach":           return "beach", 120
    return "historic", 60


async def _geocode_city(city: str) -> Optional[Tuple[float, float]]:
    """Geocode a city name using Nominatim (OSM). Returns (lat, lon) or None."""
    headers = {"User-Agent": "Roteiria/1.0 (travel-planner app)"}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": city, "format": "json", "limit": 1},
                headers=headers,
                timeout=10,
            )
            data = resp.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None


async def _fetch_osm_pois(city: str, lat: float, lon: float, radius_m: int = 15000) -> List[Dict[str, Any]]:
    """Query Overpass API for tourist POIs within radius of (lat, lon)."""
    query = f"""
[out:json][timeout:30];
(
  node["tourism"~"^(attraction|museum|gallery|viewpoint|theme_park|zoo|aquarium|artwork|monument)$"](around:{radius_m},{lat},{lon});
  node["amenity"~"^(restaurant|cafe|spa)$"]["name"](around:{radius_m},{lat},{lon});
  node["leisure"~"^(park|garden|nature_reserve)$"]["name"](around:{radius_m},{lat},{lon});
  node["historic"~"^(castle|monument|ruins|memorial)$"]["name"](around:{radius_m},{lat},{lon});
  node["natural"="beach"]["name"](around:{radius_m},{lat},{lon});
);
out body;
"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query},
                timeout=35,
            )
            data = resp.json()
    except Exception:
        return []

    results: List[Dict[str, Any]] = []
    seen: set = set()

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = (
            tags.get("name") or tags.get("name:pt") or tags.get("name:en", "")
        ).strip()
        if not name or len(name) < 3:
            continue
        key = name.lower()
        if key in seen:
            continue
        lat_el = el.get("lat")
        lon_el = el.get("lon")
        if lat_el is None or lon_el is None:
            continue
        seen.add(key)

        category, duration = _map_osm_tags(tags)

        results.append({
            "name": name,
            "category": category,
            "city": city,
            "latitude": lat_el,
            "longitude": lon_el,
            "visit_duration_minutes": duration,
        })

    return results


async def enrich_city_attractions(supabase, city: str, min_needed: int) -> int:
    """
    Ensure `city` has at least `min_needed` attractions in the DB.
    Fetches from OpenStreetMap and inserts new entries if below threshold.
    Returns total count after enrichment.
    """
    existing_resp = supabase.table("attractions").select("name").eq("city", city).execute()
    existing = existing_resp.data or []
    current_count = len(existing)

    if current_count >= min_needed:
        return current_count

    coords = await _geocode_city(city)
    if not coords:
        return current_count

    lat, lon = coords
    osm_pois = await _fetch_osm_pois(city, lat, lon)

    if not osm_pois:
        return current_count

    existing_names = {r["name"].lower() for r in existing}
    new_pois = [p for p in osm_pois if p["name"].lower() not in existing_names]

    if not new_pois:
        return current_count

    batch_size = 50
    inserted = 0
    for i in range(0, len(new_pois), batch_size):
        batch = new_pois[i : i + batch_size]
        try:
            supabase.table("attractions").insert(batch).execute()
            inserted += len(batch)
        except Exception:
            pass

    return current_count + inserted
