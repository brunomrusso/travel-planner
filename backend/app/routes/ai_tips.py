"""
AI-powered travel tips endpoint using Groq (llama3-8b-8192).
Requires GROQ_API_KEY environment variable.
Returns gracefully with tips=null if key is not configured.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.database import get_supabase
from app.auth import get_user_id_from_token
import httpx
import os
import json

router = APIRouter()


def _build_prompt(city: str, profile: str, days_map: dict) -> str:
    days_text = "\n".join(
        f"Dia {day}: {', '.join(filter(None, names)) or 'Livre'}"
        for day, names in sorted(days_map.items())
    )
    num_days = len(days_map)
    return f"""Você é um guia de viagens especialista. Gere dicas práticas e culturais para uma viagem de {num_days} dia(s) em {city}, para um viajante com perfil: {profile}.

Roteiro previsto:
{days_text}

Retorne APENAS um JSON válido (sem markdown, sem texto extra) com esta estrutura exata:
{{
  "overview": "2 frases apresentando {city} para este perfil",
  "days": [
    {{
      "day": 1,
      "theme": "tema do dia em até 4 palavras",
      "tip": "dica prática específica para este dia (1 frase)",
      "food": "sugestão gastronômica local para este dia (1 frase)"
    }}
  ]
}}"""


@router.get("/trips/{trip_id}/tips")
async def get_trip_tips(trip_id: str, user_id: str = Depends(get_user_id_from_token)):
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        return {"tips": None, "reason": "GROQ_API_KEY not configured"}

    supabase = get_supabase()

    trip_resp = supabase.table("trips").select("*").eq("id", trip_id).eq("user_id", user_id).execute()
    if not trip_resp.data:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip = trip_resp.data[0]

    itin_resp = (
        supabase.table("itineraries")
        .select("day_number, attraction_id")
        .eq("trip_id", trip_id)
        .execute()
    )

    itin_data = itin_resp.data or []
    attr_ids = list({item["attraction_id"] for item in itin_data if item.get("attraction_id")})

    attr_map: dict = {}
    if attr_ids:
        attrs_resp = supabase.table("attractions").select("id, name").in_("id", attr_ids).execute()
        attr_map = {a["id"]: a["name"] for a in (attrs_resp.data or [])}

    days_map: dict = {}
    for item in itin_data:
        day = item["day_number"]
        name = attr_map.get(item.get("attraction_id", ""), "")
        days_map.setdefault(day, []).append(name)

    if not days_map:
        return {"tips": None, "reason": "Itinerary not generated yet"}

    prompt = _build_prompt(
        city=trip["destination_city"],
        profile=trip.get("traveler_profile", "cultural"),
        days_map=days_map,
    )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama3-8b-8192",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.65,
                    "max_tokens": 1024,
                },
                timeout=30,
            )
        if resp.status_code != 200:
            return {"tips": None, "reason": "Groq API error"}

        content = resp.json()["choices"][0]["message"]["content"]
        start = content.find("{")
        end = content.rfind("}") + 1
        tips = json.loads(content[start:end])
        return {"tips": tips}

    except Exception as exc:
        return {"tips": None, "reason": str(exc)}
