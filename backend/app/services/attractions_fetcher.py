"""
Fetches tourist attractions from OpenStreetMap via Overpass API.
Used to enrich sparse cities before itinerary generation.
No API key required.
"""
import asyncio
import unicodedata
import httpx
from typing import List, Dict, Any, Optional, Tuple

# Portuguese (and common misspelling) → geocodable city name
CITY_NAME_ALIASES: Dict[str, str] = {
    # Germany
    "frankfurt sobre o meno": "Frankfurt am Main",
    "frankfurt sobre meno": "Frankfurt am Main",
    "munique": "Munich",
    "colonia": "Cologne",
    "colônia": "Cologne",
    "hamburgo": "Hamburg",
    "berlim": "Berlin",
    # Austria
    "viena": "Vienna",
    # UK
    "londres": "London",
    "edimburgo": "Edinburgh",
    # Czech Republic
    "praga": "Prague",
    # Hungary
    "budapeste": "Budapest",
    # Poland
    "varsovia": "Warsaw",
    "varsóvia": "Warsaw",
    "cracovia": "Krakow",
    "cracóvia": "Krakow",
    # Romania
    "bucareste": "Bucharest",
    # Serbia
    "belgrado": "Belgrade",
    # Greece
    "atenas": "Athens",
    # Denmark
    "copenhague": "Copenhagen",
    "copenhaga": "Copenhagen",
    # Sweden
    "estocolmo": "Stockholm",
    # Finland
    "helsinque": "Helsinki",
    # Netherlands
    "amsterda": "Amsterdam",
    "amsterdã": "Amsterdam",
    "haia": "The Hague",
    # Belgium
    "bruxelas": "Brussels",
    # Switzerland
    "zurique": "Zurich",
    "genebra": "Geneva",
    # Italy
    "roma": "Rome",
    "milao": "Milan",
    "milão": "Milan",
    "veneza": "Venice",
    "florenca": "Florence",
    "florença": "Florence",
    "napoles": "Naples",
    "nápoles": "Naples",
    # Spain
    "madri": "Madrid",
    # Portugal
    "lisboa": "Lisbon",
    # Turkey
    "istambul": "Istanbul",
    "istambull": "Istanbul",
    # Russia
    "moscou": "Moscow",
    "moscovo": "Moscow",
    # Ukraine
    "kiev": "Kyiv",
    # Ireland
    "dublim": "Dublin",
    # Japan
    "toquio": "Tokyo",
    "tóquio": "Tokyo",
    # China
    "pequim": "Beijing",
    "xangai": "Shanghai",
    # South Korea
    "seul": "Seoul",
    # Singapore
    "singapura": "Singapore",
    # South Africa
    "johanesburgo": "Johannesburg",
    "johannesburgo": "Johannesburg",
    # USA
    "nova iorque": "New York",
    "nova york": "New York",
    "nova orleans": "New Orleans",
    "sao francisco": "San Francisco",
    "são francisco": "San Francisco",
    "los angeles": "Los Angeles",
    "washington dc": "Washington D.C.",
    # Mexico
    "cidade do mexico": "Mexico City",
    "cidade do méxico": "Mexico City",
    # Colombia
    "bogota": "Bogotá",
    # Egypt
    "cairo": "Cairo",
    "o cairo": "Cairo",
}


def _normalize_city_name(city: str) -> str:
    """Return the geocodable English/local name for a Portuguese city name."""
    key = city.strip().lower()
    key_ascii = unicodedata.normalize("NFD", key).encode("ascii", "ignore").decode()
    for alias_key, mapped in CITY_NAME_ALIASES.items():
        alias_ascii = unicodedata.normalize("NFD", alias_key).encode("ascii", "ignore").decode()
        if key_ascii == alias_ascii or key == alias_key:
            return mapped
    return city


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
    if historic in ("castle", "fort", "fortification", "palace", "city_gate"): return "historic", 90
    if historic in ("monument", "memorial", "ruins"): return "historic", 45
    if natural == "beach":           return "beach", 120
    return "historic", 60


def _build_geocode_candidates(city: str) -> List[str]:
    """Build a list of candidate names to try when geocoding, from most to least specific.
    Handles Portuguese city names like 'Frankfurt sobre o Meno', 'Nova Iorque', etc.
    without relying on a hardcoded alias map."""
    import re
    candidates: List[str] = []

    # 1. Alias map for known tricky cases
    normalized = _normalize_city_name(city)
    if normalized != city:
        candidates.append(normalized)

    # 2. Original name as typed
    candidates.append(city)

    # 3. Strip Portuguese preposition phrases:
    #    "X sobre o/a Y" → "X"   (Frankfurt sobre o Meno → Frankfurt)
    #    "X do/da/de Y"  → "X"   (Rio de Janeiro stays intact — handled by Nominatim)
    stripped = re.sub(
        r"\s+(sobre\s+[oa]s?|d[oae]\s+\w+)\s*.*$", "", city, flags=re.I
    ).strip()
    if stripped and stripped.lower() != city.lower() and len(stripped) > 2:
        candidates.append(stripped)

    # 4. First word only (last resort for multi-word names)
    first_word = city.split()[0].strip() if city.split() else ""
    if len(first_word) > 3 and first_word.lower() not in (c.lower() for c in candidates):
        candidates.append(first_word)

    # Deduplicate while preserving order
    seen: set = set()
    unique: List[str] = []
    for c in candidates:
        if c.lower() not in seen:
            seen.add(c.lower())
            unique.append(c)
    return unique


async def _geocode_city(city: str) -> Optional[Tuple[float, float]]:
    """Geocode a city name using Nominatim (OSM). Returns (lat, lon) or None.
    Tries multiple candidate names automatically so Portuguese names like
    'Frankfurt sobre o Meno' or 'Nova Iorque' resolve without manual mapping."""
    headers = {"User-Agent": "Roteiria/1.0 (travel-planner app)"}
    candidates = _build_geocode_candidates(city)

    for name in candidates:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": name, "format": "json", "limit": 1},
                    headers=headers,
                    timeout=10,
                )
                data = resp.json()
                if data:
                    return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception:
            pass
    return None


OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


async def _fetch_osm_pois(city: str, lat: float, lon: float, radius_m: int = 15000) -> List[Dict[str, Any]]:
    """Query Overpass API for tourist POIs within radius of (lat, lon).
    Tries multiple public Overpass mirrors in sequence until one responds."""
    tourism_tags = "attraction|museum|gallery|viewpoint|theme_park|zoo|aquarium|artwork|monument"
    historic_tags = "castle|monument|ruins|memorial|fort|fortification|palace|city_gate"
    leisure_tags = "park|garden|nature_reserve|botanical_garden"
    query = f"""
[out:json][timeout:45];
(
  node["tourism"~"^({tourism_tags})$"](around:{radius_m},{lat},{lon});
  way["tourism"~"^({tourism_tags})$"](around:{radius_m},{lat},{lon});
  relation["tourism"~"^({tourism_tags})$"](around:{radius_m},{lat},{lon});
  node["amenity"~"^(restaurant|cafe|spa)$"]["name"](around:{radius_m},{lat},{lon});
  node["leisure"~"^({leisure_tags})$"]["name"](around:{radius_m},{lat},{lon});
  way["leisure"~"^({leisure_tags})$"]["name"](around:{radius_m},{lat},{lon});
  relation["leisure"~"^({leisure_tags})$"]["name"](around:{radius_m},{lat},{lon});
  node["historic"~"^({historic_tags})$"]["name"](around:{radius_m},{lat},{lon});
  way["historic"~"^({historic_tags})$"]["name"](around:{radius_m},{lat},{lon});
  relation["historic"~"^({historic_tags})$"]["name"](around:{radius_m},{lat},{lon});
  node["natural"="beach"]["name"](around:{radius_m},{lat},{lon});
);
out center;
"""
    data = None
    for mirror in OVERPASS_MIRRORS:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(mirror, data={"data": query}, timeout=12)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"[overpass] success via {mirror} for '{city}'")
                    break
                else:
                    print(f"[overpass] {mirror} returned HTTP {resp.status_code}")
        except Exception as e:
            print(f"[overpass] {mirror} failed: {type(e).__name__}")
            continue

    if data is None:
        print(f"[overpass] ALL mirrors failed — falling back to Nominatim for '{city}'")
        return await _fetch_pois_nominatim_fallback(city, lat, lon)

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
        # nodes have lat/lon directly; ways/relations use center
        center = el.get("center") or {}
        lat_el = el.get("lat") or center.get("lat")
        lon_el = el.get("lon") or center.get("lon")
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


async def _fetch_pois_nominatim_fallback(city: str, lat: float, lon: float) -> List[Dict[str, Any]]:
    """Fallback POI fetcher via Nominatim keyword search — used when Overpass is unreachable.
    Queries common tourist POI types near the city and filters by proximity."""
    headers = {"User-Agent": "Roteiria/1.0 (travel-planner app)"}
    search_city = _normalize_city_name(city)  # use English/local name for better results
    searches = [
        ("museum",              "museum",        120),
        ("castle palace",       "historic",       90),
        ("monument memorial",   "historic",       60),
        ("cathedral church",    "historic",       75),
        ("park garden",         "park",           90),
        ("gallery art",         "gallery",        60),
        ("zoo aquarium",        "zoo",           150),
        ("theater opera",       "entertainment", 120),
        ("viewpoint tower",     "historic",       75),
        ("historic old town",   "historic",       90),
    ]
    results: List[Dict[str, Any]] = []
    seen: set = set()

    for term, category, duration in searches:
        if len(results) >= 40:
            break
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={"q": f"{term} {search_city}", "format": "json", "limit": 5},
                    headers=headers,
                    timeout=10,
                )
                for item in resp.json():
                    name = item.get("display_name", "").split(",")[0].strip()
                    lat_p = float(item.get("lat", 0))
                    lon_p = float(item.get("lon", 0))
                    if not name or len(name) < 3 or name.lower() in seen:
                        continue
                    # Keep only POIs within ~25 km of city centre
                    dist_deg = ((lat_p - lat) ** 2 + (lon_p - lon) ** 2) ** 0.5
                    if dist_deg > 0.25:  # ~25 km
                        continue
                    seen.add(name.lower())
                    results.append({
                        "name": name,
                        "category": category,
                        "city": city,
                        "latitude": lat_p,
                        "longitude": lon_p,
                        "visit_duration_minutes": duration,
                    })
        except Exception as e:
            print(f"[nominatim-fallback] '{term}' failed: {e}")
        await asyncio.sleep(1.1)  # Nominatim ToS: max 1 req/sec

    print(f"[nominatim-fallback] found {len(results)} POIs for '{city}'")
    return results


async def enrich_city_attractions(supabase, city: str, min_needed: int) -> int:
    """
    Ensure `city` has at least `min_needed` attractions in the DB.
    Fetches from OpenStreetMap and inserts new entries if below threshold.
    Returns total count after enrichment.
    """
    existing_resp = supabase.table("attractions").select("name, category").eq("city", city).execute()
    existing = existing_resp.data or []
    current_count = len(existing)
    print(f"[enrich] city='{city}' existing={current_count} min_needed={min_needed}")

    if current_count >= min_needed:
        # Check category diversity even when count is sufficient.
        # If one category dominates (>65%), force re-enrichment to add variety.
        from collections import Counter
        cats = [r.get("category", "") for r in existing if r.get("category")]
        if cats:
            top_pct = max(Counter(cats).values()) / len(cats)
            if top_pct > 0.65:
                print(f"[enrich] poor diversity (top cat = {top_pct:.0%}) — forcing re-enrich for '{city}'")
            else:
                return current_count
        else:
            return current_count

    coords = await _geocode_city(city)
    if not coords:
        print(f"[enrich] FAILED geocoding '{city}' — all candidates exhausted")
        return current_count

    lat, lon = coords
    print(f"[enrich] geocoded '{city}' → ({lat:.4f}, {lon:.4f})")
    osm_pois = await _fetch_osm_pois(city, lat, lon)
    print(f"[enrich] Overpass returned {len(osm_pois)} POIs for '{city}'")

    if not osm_pois:
        return current_count

    existing_names = {r["name"].lower() for r in existing}
    new_pois = [p for p in osm_pois if p["name"].lower() not in existing_names]
    print(f"[enrich] {len(new_pois)} new POIs to insert for '{city}'")

    if not new_pois:
        return current_count

    batch_size = 50
    inserted = 0
    for i in range(0, len(new_pois), batch_size):
        batch = new_pois[i : i + batch_size]
        try:
            supabase.table("attractions").insert(batch).execute()
            inserted += len(batch)
        except Exception as e:
            print(f"[enrich] INSERT ERROR for '{city}' batch {i}: {e}")

    print(f"[enrich] inserted {inserted} attractions for '{city}', total={current_count + inserted}")
    return current_count + inserted
