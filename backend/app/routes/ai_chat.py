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


class AdjustMessage(BaseModel):
    command: str
    history: list = []


def _build_adjust_prompt(trip: dict, itinerary_str: str) -> str:
    city = trip.get("destination_city", "destino")
    return (
        f"Você é um assistente de ajuste de roteiro de viagem para {city}. "
        f"Roteiro atual:\n{itinerary_str}\n\n"
        "Interprete o comando do usuário e responda SEMPRE em JSON válido:\n"
        '{"reply": "mensagem amigável em português explicando o que será feito", "action": null}\n'
        "Para remover uma atração use: "
        '{"reply": "...", "action": {"type": "remove", "attraction_name": "nome EXATO como no roteiro acima"}}\n'
        "Para mover para outro dia use: "
        '{"reply": "...", "action": {"type": "move", "attraction_name": "nome EXATO", "target_day": 2}}\n'
        "Se não entender ou não for possível: "
        '{"reply": "Não consegui entender. Pode especificar qual atração e o que deseja fazer?", "action": null}\n'
        "Para adicionar uma atração por tema/categoria use: "
        '{"reply": "...", "action": {"type": "add", "category": "museum", "target_day": 2, "name_hint": "arte moderna"}}\n'
        "IMPORTANTE: para remove/move os nomes devem ser EXATAMENTE como no roteiro. Responda apenas com JSON."
    )


@router.post("/trips/{trip_id}/adjust")
async def adjust_itinerary(
    trip_id: str,
    body: AdjustMessage,
    user_id: str = Depends(get_user_id_from_token),
):
    import json as _json
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise HTTPException(status_code=503, detail="AI não configurado (GROQ_API_KEY ausente)")

    if not body.command or len(body.command.strip()) < 3:
        raise HTTPException(status_code=400, detail="Comando muito curto")

    try:
        supabase = get_supabase()

        trip_resp = supabase.table("trips").select("*").eq("id", trip_id).eq("user_id", user_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=404, detail="Viagem não encontrada")
        trip = trip_resp.data[0]

        itin_resp = (
            supabase.table("itineraries")
            .select("day_number, order_in_day, attraction_id")
            .eq("trip_id", trip_id)
            .order("day_number")
            .order("order_in_day")
            .execute()
        )
        itin_data = itin_resp.data or []

        attr_ids = list({i["attraction_id"] for i in itin_data if i.get("attraction_id")})
        attr_map: dict = {}
        if attr_ids:
            attrs = supabase.table("attractions").select("id, name").in_("id", attr_ids).execute()
            attr_map = {a["id"]: a["name"] for a in (attrs.data or [])}

        days_map: dict = {}
        for item in itin_data:
            day = item["day_number"]
            name = attr_map.get(item.get("attraction_id", ""), "")
            if name:
                days_map.setdefault(day, []).append(name)

        itinerary_str = "\n".join(
            f"Dia {d}: {', '.join(names)}" for d, names in sorted(days_map.items())
        ) or "Roteiro vazio"

        system_prompt = _build_adjust_prompt(trip, itinerary_str)

        messages = [{"role": "system", "content": system_prompt}]
        for h in body.history[-6:]:
            if h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": body.command.strip()})

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": messages,
                    "temperature": 0.2,
                    "max_tokens": 300,
                    "response_format": {"type": "json_object"},
                },
                timeout=20,
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Erro Groq: {resp.text[:200]}")

        raw = resp.json()["choices"][0]["message"]["content"]
        try:
            parsed = _json.loads(raw)
            return {"reply": parsed.get("reply", raw), "action": parsed.get("action")}
        except Exception:
            return {"reply": raw, "action": None}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


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
