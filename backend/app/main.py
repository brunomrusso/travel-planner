from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth, trips, attractions, itineraries, ai_tips

app = FastAPI(
    title="Travel Planner API",
    description="API for planning personalized travel itineraries",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(trips.router)
app.include_router(attractions.router)
app.include_router(itineraries.router)
app.include_router(ai_tips.router)

@app.get("/")
async def root():
    return {"message": "Travel Planner API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/debug")
async def debug():
    import httpx
    supabase_test = None
    try:
        r = httpx.get(f"{settings.SUPABASE_URL}/rest/v1/trips?select=count", headers={
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY}",
        }, timeout=5)
        supabase_test = {"status": r.status_code, "body": r.json()}
    except Exception as e:
        supabase_test = {"error": str(e)}
    return {
        "status": "ok",
        "supabase_url": settings.SUPABASE_URL,
        "supabase_key_prefix": (settings.SUPABASE_KEY or "")[:20] + "...",
        "service_role_prefix": (settings.SUPABASE_SERVICE_ROLE_KEY or "")[:20] + "...",
        "supabase_test": supabase_test,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
