"""User preferences stored in Supabase GoTrue user_metadata (no extra table needed)."""
from fastapi import APIRouter, Header
from app.config import settings
from pydantic import BaseModel
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
