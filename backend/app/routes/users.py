"""User preferences stored in Supabase GoTrue user_metadata (no extra table needed)."""
from fastapi import APIRouter, Header, HTTPException
from app.config import settings
from app.database import get_supabase
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter(prefix="/users", tags=["users"])


class Preferences(BaseModel):
    default_profile: str = ""
    display_name: str = ""


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "apikey": settings.SUPABASE_KEY}


@router.get("/me/preferences")
async def get_preferences(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers=_auth_headers(token),
                timeout=10,
            )
        if resp.status_code != 200:
            return {"default_profile": "", "display_name": "", "email": ""}
        user = resp.json()
        meta = user.get("user_metadata") or {}
        email = user.get("email", "")
        return {
            "default_profile": meta.get("default_profile", ""),
            "display_name": meta.get("display_name", email.split("@")[0]),
            "email": email,
        }
    except Exception:
        return {"default_profile": "", "display_name": "", "email": ""}


@router.patch("/me/preferences")
async def update_preferences(prefs: Preferences, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.put(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={**_auth_headers(token), "Content-Type": "application/json"},
                json={"data": prefs.model_dump()},
                timeout=10,
            )
        return {"ok": resp.status_code == 200}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ─── Passport ────────────────────────────────────────────────────────────────

class ManualCountry(BaseModel):
    country: str
    country_code: str
    year: Optional[int] = None


async def _get_user(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers=_auth_headers(token),
            timeout=10,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return resp.json()


def _build_passport(user: dict, trips: list) -> dict:
    meta = user.get("user_metadata") or {}
    manual = meta.get("passport_countries", [])
    completed = [t for t in trips if t.get("status") == "completed"]
    trip_countries = []
    for trip in completed:
        dests = trip.get("destinations") or [{"city": trip.get("destination_city", ""), "country": "", "country_code": ""}]
        for dest in dests:
            cc = (dest.get("country_code") or "").lower()
            if cc:
                trip_countries.append({
                    "country": dest.get("country", ""),
                    "country_code": cc,
                    "city": dest.get("city", ""),
                    "year": int(trip["end_date"][:4]) if trip.get("end_date") else None,
                    "source": "trip",
                })
    # Deduplicate: manual takes precedence, then trip_countries
    seen = {c["country_code"] for c in manual}
    for tc in trip_countries:
        if tc["country_code"] not in seen:
            seen.add(tc["country_code"])
            manual = manual + [tc]
    all_countries = manual
    continents = _count_continents([c["country_code"] for c in all_countries])
    return {
        "countries": all_countries,
        "stats": {
            "countries": len(all_countries),
            "continents": continents,
            "trips": len(completed),
        },
    }


_CONTINENT_MAP: dict = {
    "pt": "EU", "es": "EU", "fr": "EU", "it": "EU", "de": "EU", "gb": "EU",
    "nl": "EU", "be": "EU", "ch": "EU", "at": "EU", "se": "EU", "no": "EU",
    "dk": "EU", "fi": "EU", "pl": "EU", "cz": "EU", "hu": "EU", "ro": "EU",
    "gr": "EU", "hr": "EU", "sk": "EU", "si": "EU", "bg": "EU", "rs": "EU",
    "ie": "EU", "is": "EU", "lt": "EU", "lv": "EU", "ee": "EU", "lu": "EU",
    "br": "SA", "ar": "SA", "cl": "SA", "co": "SA", "pe": "SA", "ve": "SA",
    "bo": "SA", "py": "SA", "uy": "SA", "ec": "SA", "gy": "SA", "sr": "SA",
    "us": "NA", "ca": "NA", "mx": "NA", "cu": "NA", "gt": "NA", "hn": "NA",
    "ni": "NA", "cr": "NA", "pa": "NA", "do": "NA", "jm": "NA", "ht": "NA",
    "cn": "AS", "jp": "AS", "kr": "AS", "in": "AS", "th": "AS", "vn": "AS",
    "id": "AS", "my": "AS", "sg": "AS", "ph": "AS", "kh": "AS", "mm": "AS",
    "la": "AS", "bd": "AS", "lk": "AS", "np": "AS", "pk": "AS", "af": "AS",
    "ae": "AS", "sa": "AS", "tr": "AS", "il": "AS", "jo": "AS", "lb": "AS",
    "ir": "AS", "iq": "AS", "kz": "AS", "uz": "AS", "mn": "AS", "az": "AS",
    "ge": "AS", "am": "AS", "ru": "EU",
    "za": "AF", "ng": "AF", "ke": "AF", "eg": "AF", "ma": "AF", "tz": "AF",
    "gh": "AF", "et": "AF", "ci": "AF", "sn": "AF", "cm": "AF", "ug": "AF",
    "ao": "AF", "mz": "AF", "zw": "AF", "zm": "AF", "rw": "AF", "dz": "AF",
    "tn": "AF", "ly": "AF", "sd": "AF", "ml": "AF", "ne": "AF", "bf": "AF",
    "au": "OC", "nz": "OC", "fj": "OC", "pg": "OC", "sb": "OC", "vu": "OC",
}


def _count_continents(codes: list) -> int:
    return len({_CONTINENT_MAP.get(c.lower()) for c in codes if _CONTINENT_MAP.get(c.lower())})


@router.get("/me/passport")
async def get_passport(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    user = await _get_user(token)
    supabase = get_supabase()
    trips_resp = supabase.table("trips").select("*").eq("user_id", user["id"]).execute()
    return _build_passport(user, trips_resp.data or [])


@router.post("/me/passport/countries")
async def add_passport_country(country: ManualCountry, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    user = await _get_user(token)
    meta = user.get("user_metadata") or {}
    countries = meta.get("passport_countries", [])
    cc = country.country_code.lower()
    if any(c["country_code"] == cc for c in countries):
        return {"ok": True, "message": "already exists"}
    countries.append({"country": country.country, "country_code": cc, "year": country.year, "source": "manual"})
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={**_auth_headers(token), "Content-Type": "application/json"},
            json={"data": {**meta, "passport_countries": countries}},
            timeout=10,
        )
    return {"ok": resp.status_code == 200}


@router.delete("/me/passport/countries/{country_code}")
async def remove_passport_country(country_code: str, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    user = await _get_user(token)
    meta = user.get("user_metadata") or {}
    countries = [c for c in meta.get("passport_countries", []) if c["country_code"] != country_code.lower()]
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={**_auth_headers(token), "Content-Type": "application/json"},
            json={"data": {**meta, "passport_countries": countries}},
            timeout=10,
        )
    return {"ok": resp.status_code == 200}


@router.get("/{user_id}/passport")
async def get_public_passport(user_id: str):
    """Public endpoint — no auth required."""
    try:
        supabase = get_supabase()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers={"Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}", "apikey": settings.SUPABASE_SERVICE_ROLE_KEY},
                timeout=10,
            )
        if resp.status_code != 200:
            raise HTTPException(status_code=404, detail="User not found")
        user = resp.json()
        trips_resp = supabase.table("trips").select("*").eq("user_id", user_id).execute()
        passport = _build_passport(user, trips_resp.data or [])
        meta = user.get("user_metadata") or {}
        return {**passport, "display_name": meta.get("display_name", "Viajante")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
