from supabase import create_client, Client
from app.config import settings

_supabase_client: Client = None

def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        try:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        except Exception as e:
            print(f"Warning: Could not initialize Supabase client: {e}")
            print("Make sure SUPABASE_URL and SUPABASE_KEY are set in .env")
            raise
    return _supabase_client
