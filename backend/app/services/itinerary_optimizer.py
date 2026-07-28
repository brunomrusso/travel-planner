from typing import List, Dict, Any, Set
from datetime import datetime, timedelta, date
from uuid import UUID
from app.services.osrm_service import OSRMService
from app.services.attractions_fetcher import enrich_city_attractions
from collections import defaultdict
import math

class ItineraryOptimizer:
    ENERGY_LEVEL: Dict[str, int] = {
        # 1 = morning (high energy / active outdoors)
        "hiking": 1, "park": 1, "beach": 1, "monument": 1,
        # 2 = afternoon (culture / exploration)
        "museum": 2, "gallery": 2, "historic": 2, "zoo": 2, "market": 2, "shopping": 2,
        # 3 = evening (relaxed / social)
        "restaurant": 3, "cafe": 3, "bar": 3, "spa": 3, "entertainment": 3,
    }

    INDOOR_CATEGORIES: set = {
        "museum", "gallery", "restaurant", "cafe", "bar",
        "entertainment", "shopping", "spa", "cinema", "theatre",
    }

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

    async def generate_itinerary(
        self, trip_id: UUID, trip: Dict[str, Any], weather_data: List[Dict] = None
    ) -> List[Dict[str, Any]]:
        weights = self._merge_profile_weights(trip.get("traveler_profile", "cultural"))

        start_date = datetime.fromisoformat(trip["start_date"])
        end_date = datetime.fromisoformat(trip["end_date"])
        num_days = (end_date - start_date).days + 1

        # Build global rainy_days set from weather forecast
        global_rainy_days: Set[int] = set()
        if weather_data:
            start_d = start_date.date()
            for w in weather_data:
                if w.get("is_rainy"):
                    try:
                        d = date.fromisoformat(w["date"])
                        day_num = (d - start_d).days + 1
                        if 1 <= day_num <= num_days:
                            global_rainy_days.add(day_num)
                    except Exception:
                        pass

        destinations = trip.get("destinations") or []
        if not destinations:
            destinations = [{"city": trip["destination_city"]}]

        all_itinerary: List[Dict[str, Any]] = []

        # Use explicit days per city if provided, otherwise distribute equally
        explicit = [dest.get("days") for dest in destinations]
        if all(isinstance(d, int) and d > 0 for d in explicit):
            city_days_list = list(explicit)
            city_days_list[-1] = max(1, num_days - sum(city_days_list[:-1]))
        else:
            base = max(1, num_days // len(destinations))
            city_days_list = [base] * len(destinations)
            city_days_list[-1] = max(1, num_days - sum(city_days_list[:-1]))

        current_day = 1
        for city_idx, dest in enumerate(destinations):
            city = dest["city"]
            city_days = city_days_list[city_idx]
            city_start_day = current_day
            current_day += city_days

            # Translate global rainy days to local (per-city) day numbers
            city_rainy_days: Set[int] = {
                d - city_start_day + 1
                for d in global_rainy_days
                if city_start_day <= d < city_start_day + city_days
            }

            min_needed = city_days * 8   # request more so diversity pass has a wider pool
            await enrich_city_attractions(self.supabase, city, min_needed)

            resp = self.supabase.table("attractions").select("*").eq("city", city).execute()
            attractions = resp.data
            if not attractions:
                continue

            scored = self._score_attractions(attractions, weights)
            city_itinerary = self._distribute_attractions_by_day(scored, city_days, city_rainy_days)

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
    
    def _kmeans_init(self, coords: List[tuple], k: int) -> List[tuple]:
        """Farthest-first deterministic seeding: each new centroid is the point
        furthest from all already-chosen centroids. Guarantees spread across the city."""
        if not coords or k <= 0:
            return []
        centroids = [coords[0]]
        coord_set = list(coords)  # keep order
        while len(centroids) < k:
            farthest = max(
                (c for c in coord_set if c not in centroids),
                key=lambda c: min(self._distance(c, ct) for ct in centroids),
                default=None,
            )
            if farthest is None:
                break
            centroids.append(farthest)
        return centroids

    def _distribute_attractions_by_day(
        self, attractions: List[Dict[str, Any]], num_days: int, rainy_days: Set[int] = None
    ) -> List[Dict[str, Any]]:
        """Cluster attractions geographically with K-Means so that nearby places
        land on the same day. Restaurants/cafes are added as supplements to days
        that already have main attractions — never as a day's sole anchor.
        k is bounded so each cluster contains at least MIN_PER_DAY main attractions."""
        if not attractions or num_days <= 0:
            return []

        TARGET_MINUTES = 6 * 60   # 6 h of activities per day
        MAX_PER_DAY = 6
        MIN_PER_DAY = 3           # minimum main attractions per populated day

        # --- Separate restaurants/cafes from main sightseeing attractions ---
        RESTAURANT_CATS = {"restaurant", "cafe", "bar"}

        # --- Category diversity pass ---
        # Cap how many attractions of the same category enter the pool.
        # With multi-profile trips (e.g., Cultural + Family + Adventure + Gastronomic),
        # "museum" gets score=5 and would monopolise all slots.
        # cap = max 1 per day of each category (e.g., 3 museums for a 3-day trip).
        cat_cap = max(2, num_days)
        cat_counts: Dict[str, int] = {}
        diverse: List[Dict[str, Any]] = []
        deferred: List[Dict[str, Any]] = []
        for a in attractions:
            cat = a.get("category", "").lower()
            if cat_counts.get(cat, 0) < cat_cap:
                diverse.append(a)
                cat_counts[cat] = cat_counts.get(cat, 0) + 1
            else:
                deferred.append(a)
        # Append deferred so overflow slots still fill from the same category
        attractions = diverse + deferred

        # Separate restaurants BEFORE applying the pool cap so that gastronomy/relax
        # profiles (which score restaurants highly) don't starve the main sightseeing pool.
        main_all = [a for a in attractions if a.get("category", "").lower() not in RESTAURANT_CATS]
        resto_all = [a for a in attractions if a.get("category", "").lower() in RESTAURANT_CATS]

        main_pool = main_all[: MAX_PER_DAY * num_days]
        resto_pool = resto_all[: num_days * 2]   # at most 2 restaurants per day

        # Fallback: if only restaurants in DB, treat them as main
        if not main_pool:
            main_pool = attractions[: MAX_PER_DAY * num_days]
            resto_pool = []

        n = len(main_pool)
        # Allow k = num_days as long as there is at least 1 main attraction per day.
        # Only reduce k when the DB truly doesn't have enough attractions.
        k = min(num_days, max(1, n))

        coords = [(a["latitude"], a["longitude"]) for a in main_pool]

        # --- Geographic K-Means ---
        centroids = self._kmeans_init(coords, k)
        assignments = [0] * n

        for _ in range(30):  # iterate until stable
            changed = False
            for idx, coord in enumerate(coords):
                nearest = min(range(k), key=lambda c: self._distance(coord, centroids[c]))
                if assignments[idx] != nearest:
                    assignments[idx] = nearest
                    changed = True
            for c in range(k):
                cluster_coords = [coords[i] for i in range(n) if assignments[i] == c]
                if cluster_coords:
                    centroids[c] = (
                        sum(lat for lat, _ in cluster_coords) / len(cluster_coords),
                        sum(lon for _, lon in cluster_coords) / len(cluster_coords),
                    )
            if not changed:
                break

        # --- Map clusters → days ---
        clusters: Dict[int, List[int]] = {c: [] for c in range(k)}
        for idx, c in enumerate(assignments):
            clusters[c].append(idx)

        cluster_scores = {
            c: sum(main_pool[i].get("score", 1) for i in idxs) / max(len(idxs), 1)
            for c, idxs in clusters.items()
        }

        if rainy_days:
            indoor_ratio = {
                c: sum(1 for i in idxs if main_pool[i].get("category", "").lower() in self.INDOOR_CATEGORIES)
                   / max(len(idxs), 1)
                for c, idxs in clusters.items()
            }
            clusters_by_indoor = sorted(clusters.keys(), key=lambda c: indoor_ratio[c], reverse=True)
            clusters_by_outdoor = sorted(clusters.keys(), key=lambda c: indoor_ratio[c])
            cluster_to_day: Dict[int, int] = {}
            rainy_sorted = sorted(rainy_days)
            sunny_days = [d for d in range(1, num_days + 1) if d not in rainy_days]
            for i, day in enumerate(rainy_sorted):
                if i < len(clusters_by_indoor):
                    cluster_to_day[clusters_by_indoor[i]] = day
            remaining = [c for c in clusters_by_outdoor if c not in cluster_to_day]
            for i, day in enumerate(sunny_days):
                if i < len(remaining):
                    cluster_to_day[remaining[i]] = day
            assigned_days = set(cluster_to_day.values())
            leftover_days = [d for d in range(1, num_days + 1) if d not in assigned_days]
            unmapped = [c for c in clusters if c not in cluster_to_day]
            for c, d in zip(unmapped, leftover_days):
                cluster_to_day[c] = d
        else:
            sorted_clusters = sorted(clusters.keys(), key=lambda c: cluster_scores[c], reverse=True)
            cluster_to_day = {c: day + 1 for day, c in enumerate(sorted_clusters)}

        # --- Build itinerary with per-day time cap ---
        days_minutes: Dict[int, int] = {d: 0 for d in range(1, num_days + 1)}
        days_counts: Dict[int, int] = {d: 0 for d in range(1, num_days + 1)}
        itinerary: List[Dict[str, Any]] = []
        overflow: List[Dict[str, Any]] = []

        for c in sorted(cluster_to_day.keys(), key=lambda c: cluster_to_day[c]):
            day = cluster_to_day[c]
            sorted_idxs = sorted(clusters[c], key=lambda i: main_pool[i].get("score", 1), reverse=True)
            for attr_i in sorted_idxs:
                attr = main_pool[attr_i]
                duration = attr.get("visit_duration_minutes", 60)
                if days_minutes[day] + duration <= TARGET_MINUTES and days_counts[day] < MAX_PER_DAY:
                    days_counts[day] += 1
                    days_minutes[day] += duration
                    itinerary.append({
                        "day_number": day,
                        "order_in_day": days_counts[day],
                        "attraction": attr,
                        "start_time": None,
                        "notes": "",
                    })
                else:
                    overflow.append(attr)

        # Place overflow main attractions into days that already have content
        for attr in overflow:
            duration = attr.get("visit_duration_minutes", 60)
            eligible = [
                d for d in range(1, num_days + 1)
                if days_counts[d] > 0
                and days_counts[d] < MAX_PER_DAY
                and days_minutes[d] + duration <= TARGET_MINUTES
            ]
            if not eligible:
                eligible = [
                    d for d in range(1, num_days + 1)
                    if days_counts[d] < MAX_PER_DAY and days_minutes[d] + duration <= TARGET_MINUTES
                ]
            if not eligible:
                break
            target_day = min(eligible, key=lambda d: days_minutes[d])
            days_counts[target_day] += 1
            days_minutes[target_day] += duration
            itinerary.append({
                "day_number": target_day,
                "order_in_day": days_counts[target_day],
                "attraction": attr,
                "start_time": None,
                "notes": "",
            })

        # Add restaurants to days that already have main attractions (as lunch/dinner stops)
        for attr in resto_pool:
            duration = attr.get("visit_duration_minutes", 60)
            eligible = [
                d for d in range(1, num_days + 1)
                if days_counts[d] > 0
                and days_counts[d] < MAX_PER_DAY
                and days_minutes[d] + duration <= TARGET_MINUTES
            ]
            if not eligible:
                break
            # Prefer the day with the most planned time (most likely to benefit from a meal stop)
            target_day = max(eligible, key=lambda d: days_minutes[d])
            days_counts[target_day] += 1
            days_minutes[target_day] += duration
            itinerary.append({
                "day_number": target_day,
                "order_in_day": days_counts[target_day],
                "attraction": attr,
                "start_time": None,
                "notes": "",
            })

        return itinerary
    
    async def _optimize_daily_routes(self, itinerary: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        days: Dict[int, List] = {}
        for item in itinerary:
            day = item["day_number"]
            if day not in days:
                days[day] = []
            days[day].append(item)

        optimized = []
        for day, items in sorted(days.items()):
            # Tag energy level and indoor/outdoor for each item
            for item in items:
                cat = item["attraction"].get("category", "").lower()
                item["energy_level"] = self.ENERGY_LEVEL.get(cat, 2)
                item["is_outdoor"] = cat not in self.INDOOR_CATEGORIES

            if len(items) <= 1:
                for item in items:
                    item["order_in_day"] = 1
                optimized.extend(items)
                continue

            # Split into energy tiers: 1=morning, 2=afternoon, 3=evening
            tiers: Dict[int, List] = {1: [], 2: [], 3: []}
            for item in items:
                tiers[item["energy_level"]].append(item)

            # Apply nearest-neighbor within each tier, chaining between tiers
            ordered = []
            prev_coord = None
            for tier_num in [1, 2, 3]:
                tier_items = tiers[tier_num]
                if not tier_items:
                    continue
                tier_coords = [
                    (i["attraction"]["latitude"], i["attraction"]["longitude"])
                    for i in tier_items
                ]
                start = 0
                if prev_coord and len(tier_items) > 1:
                    start = min(
                        range(len(tier_items)),
                        key=lambda idx: self._distance(prev_coord, tier_coords[idx]),
                    )
                path = self._nearest_neighbor_tsp_from(tier_coords, start)
                for idx in path:
                    ordered.append(tier_items[idx])
                last = ordered[-1]["attraction"]
                prev_coord = (last["latitude"], last["longitude"])

            for order, item in enumerate(ordered, 1):
                item["order_in_day"] = order
                optimized.append(item)

        return optimized

    def _nearest_neighbor_tsp_from(self, coordinates: List[tuple], start: int = 0) -> List[int]:
        if not coordinates:
            return []
        n = len(coordinates)
        unvisited = set(range(n))
        current = start
        path = [current]
        unvisited.remove(current)
        while unvisited:
            nearest = min(unvisited, key=lambda x: self._distance(coordinates[current], coordinates[x]))
            path.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        return path

    def _nearest_neighbor_tsp(self, coordinates: List[tuple]) -> List[int]:
        return self._nearest_neighbor_tsp_from(coordinates, 0)
    
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
