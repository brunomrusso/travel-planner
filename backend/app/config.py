from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8001")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3001")
    
    class Config:
        env_file = ".env"

try:
    settings = Settings()
except Exception as e:
    print(f"Warning: Could not load settings: {e}")
    # Create a default settings object
    settings = Settings(
        SUPABASE_URL="",
        SUPABASE_KEY="",
        SUPABASE_JWT_SECRET="",
        BACKEND_URL="http://localhost:8001",
        FRONTEND_URL="http://localhost:3001"
    )
