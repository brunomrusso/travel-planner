from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.database import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user_id: str

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    supabase = get_supabase()
    try:
        # Check if Supabase is configured
        if not supabase or not hasattr(supabase, 'auth'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase not configured. Check SUPABASE_URL and SUPABASE_KEY in .env"
            )
        
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        return AuthResponse(
            access_token=response.session.access_token if response.session else "",
            user_id=response.user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Register error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Registration failed: {str(e)}")

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    supabase = get_supabase()
    try:
        # Check if Supabase is configured
        if not supabase or not hasattr(supabase, 'auth'):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase not configured. Check SUPABASE_URL and SUPABASE_KEY in .env"
            )
        
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        return AuthResponse(
            access_token=response.session.access_token,
            user_id=response.user.id
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Login failed: {str(e)}")

@router.post("/logout")
async def logout():
    return {"message": "Logout successful"}
