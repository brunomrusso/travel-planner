"""
AI chat endpoint — allows users to ask free-form questions about their trip.
Uses Groq (llama-3.1-8b-instant). Requires GROQ_API_KEY env var.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.database import get_supabase
from app.auth import get_user_id_from_token
import httpx
import os

router = APIRouter()


class ChatMessage(BaseModel):
    message: str


def _build_system_prompt(trip: dict, itinerary_summary: str) -> str:
    city = trip.get("destination_city", "destino desconhecido")
    profile = trip.get("traveler_profile", "cultural")
    start = trip.get("start_date", "")
    end = trip.get("end_date", "")
    return (
        f"Você é um assistente especialista em viagens para {city}. "
        f"O viajante tem perfil '{profile}' e viaja de {start} até {end}. "
        f"Roteiro atual: {itinerary_summary or 'ainda não gerado'}. "
        "Responda de forma concisa, prática e em português. "
        "Se não souber algo específico, diga claramente. Máximo 3 parágrafos curtos."
    )


@router.post("/trips/{trip_id}/chat")
async def chat_about_trip(
    trip_id: str,
    body: ChatMessage,
    user_id: str = Depends(get_user_id_from_token),
):
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=503, detail="AI chat não configurado (GROQ_API_KEY ausente)")

    if not body.message or len(body.message.strip()) < 3:
        raise HTTPException(status_code=400, detail="Mensagem muito curta")

    if len(body.message) > 500:
        raise HTTPException(status_code=400, detail="Mensagem muito longa (máx 500 caracteres)")

    try:
        supabase = get_supabase()

        trip_resp = supabase.table("trips").select("*").eq("id", trip_id).eq("user_id", user_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=404, detail="Viagem não encontrada")
        trip = trip_resp.data[0]

        itin_resp = (
            supabase.table("itineraries")
            .select("day_number, attraction_id")
            .eq("trip_id", trip_id)
            .order("day_number")
            .execute()
        )
        itin_data = itin_resp.data or []

        itinerary_summary = "Sem roteiro gerado ainda"
        if itin_data:
            attr_ids = list({item["attraction_id"] for item in itin_data if item.get("attraction_id")})
            attr_map: dict = {}
            if attr_ids:
                attrs_resp = supabase.table("attractions").select("id, name").in_("id", attr_ids).execute()
                attr_map = {a["id"]: a["name"] for a in (attrs_resp.data or [])}

            days_map: dict = {}
            for item in itin_data:
                day = item["day_number"]
                name = attr_map.get(item.get("attraction_id", ""), "")
                if name:
                    days_map.setdefault(day, []).append(name)

            if days_map:
                itinerary_summary = "; ".join(
                    f"Dia {d}: {', '.join(names)}"
                    for d, names in sorted(days_map.items())
                )

        system_prompt = _build_system_prompt(trip, itinerary_summary)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": body.message.strip()},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 512,
                },
                timeout=20,
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Erro Groq: {resp.text[:200]}")

        reply = resp.json()["choices"][0]["message"]["content"]
        return {"reply": reply}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
