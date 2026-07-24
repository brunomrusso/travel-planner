"""
Trip sharing endpoints — share trips with other app users by email.
Requires trip_shares table in Supabase (see README for migration SQL).
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.database import get_supabase
from app.auth import get_user_id_from_token
from app.config import settings
import httpx

router = APIRouter(prefix="/trips", tags=["shares"])


class ShareRequest(BaseModel):
    email: str
    permission: str = "view"  # "view" or "edit"


async def _lookup_user_by_email(email: str) -> Optional[str]:
    """Look up a Supabase user ID by email using the admin API."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users",
                headers={
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                },
                params={"email": email},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                users = data.get("users", [])
                if users:
                    return users[0]["id"]
    except Exception:
        pass
    return None


@router.get("/{trip_id}/shares")
async def list_shares(trip_id: str, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    trip = supabase.table("trips").select("id").eq("id", trip_id).eq("user_id", user_id).execute()
    if not trip.data:
        raise HTTPException(status_code=404, detail="Viagem não encontrada")
    shares = supabase.table("trip_shares").select("*").eq("trip_id", trip_id).execute()
    return shares.data or []


@router.post("/{trip_id}/shares", status_code=201)
async def create_share(trip_id: str, body: ShareRequest, user_id: str = Depends(get_user_id_from_token)):
    if body.permission not in ("view", "edit"):
        raise HTTPException(status_code=400, detail="Permissão inválida")

    supabase = get_supabase()
    trip = supabase.table("trips").select("id, destination_city").eq("id", trip_id).eq("user_id", user_id).execute()
    if not trip.data:
        raise HTTPException(status_code=404, detail="Viagem não encontrada")

    email = body.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email inválido")

    existing = supabase.table("trip_shares").select("id").eq("trip_id", trip_id).eq("shared_with_email", email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Viagem já compartilhada com este usuário")

    shared_user_id = await _lookup_user_by_email(email)

    result = supabase.table("trip_shares").insert({
        "trip_id": trip_id,
        "owner_id": user_id,
        "shared_with_email": email,
        "shared_with_user_id": shared_user_id,
        "permission": body.permission,
    }).execute()

    return result.data[0]


@router.delete("/{trip_id}/shares/{share_id}", status_code=204)
async def delete_share(trip_id: str, share_id: str, user_id: str = Depends(get_user_id_from_token)):
    supabase = get_supabase()
    trip = supabase.table("trips").select("id").eq("id", trip_id).eq("user_id", user_id).execute()
    if not trip.data:
        raise HTTPException(status_code=404, detail="Viagem não encontrada")
    supabase.table("trip_shares").delete().eq("id", share_id).eq("trip_id", trip_id).execute()


@router.get("/shared-with-me")
async def shared_with_me(user_id: str = Depends(get_user_id_from_token)):
    """Returns trips that other users have shared with the current user."""
    supabase = get_supabase()

    shares = (
        supabase.table("trip_shares")
        .select("*")
        .eq("shared_with_user_id", user_id)
        .execute()
    )
    if not shares.data:
        return []

    trip_ids = [s["trip_id"] for s in shares.data]
    trips_resp = supabase.table("trips").select("*").in_("id", trip_ids).execute()
    trips = trips_resp.data or []

    share_map = {s["trip_id"]: s for s in shares.data}
    for t in trips:
        share = share_map.get(t["id"], {})
        t["_shared_by"] = share.get("owner_id", "")
        t["_permission"] = share.get("permission", "view")
        t["_share_id"] = share.get("id", "")

    return trips
