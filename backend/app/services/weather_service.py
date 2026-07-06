import httpx
from datetime import date
from typing import List, Dict, Optional, Tuple


class WeatherService:
    FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
    GEOCODE_URL = "https://nominatim.openstreetmap.org/search"

    async def get_forecast(
        self, city: str, start_date: date, end_date: date
    ) -> List[Dict]:
        coords = await self._geocode(city)
        if not coords:
            return []
        lat, lon = coords

        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min",
            "timezone": "auto",
            "start_date": str(start_date),
            "end_date": str(end_date),
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self.FORECAST_URL, params=params)
                if resp.status_code != 200:
                    return []
                data = resp.json()
        except Exception:
            return []

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        precip = daily.get("precipitation_sum", [])
        codes = daily.get("weather_code", [])
        temp_max = daily.get("temperature_2m_max", [])
        temp_min = daily.get("temperature_2m_min", [])

        result = []
        for i, d in enumerate(dates):
            p = float(precip[i] or 0) if i < len(precip) else 0.0
            code = int(codes[i] or 0) if i < len(codes) else 0
            result.append({
                "date": d,
                "precipitation_mm": p,
                "weather_code": code,
                "temp_max": round(float(temp_max[i]), 1) if i < len(temp_max) and temp_max[i] is not None else None,
                "temp_min": round(float(temp_min[i]), 1) if i < len(temp_min) and temp_min[i] is not None else None,
                "is_rainy": p >= 5.0,
                "icon": self._icon(code, p),
                "description": self._description(code),
            })
        return result

    async def _geocode(self, city: str) -> Optional[Tuple[float, float]]:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    self.GEOCODE_URL,
                    params={"q": city, "format": "json", "limit": 1},
                    headers={"User-Agent": "RoteiriaApp/1.0"},
                )
                data = resp.json()
                if data:
                    return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception:
            pass
        return None

    def _description(self, code: int) -> str:
        if code == 0:
            return "Céu limpo"
        if code in (1, 2, 3):
            return "Parcialmente nublado"
        if code in (45, 48):
            return "Neblina"
        if code in (51, 53, 55):
            return "Garoa"
        if code in (61, 63, 65):
            return "Chuva"
        if code in (71, 73, 75):
            return "Neve"
        if code in (80, 81, 82):
            return "Pancadas de chuva"
        if code in (95, 96, 99):
            return "Tempestade"
        return "Variável"

    def _icon(self, code: int, precip: float) -> str:
        if precip >= 10:
            return "⛈️"
        if precip >= 5:
            return "🌧️"
        if precip >= 1:
            return "🌦️"
        if code == 0:
            return "☀️"
        if code in (1, 2):
            return "🌤️"
        if code == 3:
            return "☁️"
        if code in (45, 48):
            return "🌫️"
        if code in (71, 73, 75):
            return "❄️"
        return "🌤️"
