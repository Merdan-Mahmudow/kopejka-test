from fastapi import APIRouter, Response

from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.api.deps import DbSession
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(user_in: UserCreate, db: DbSession, response: Response):
    service = AuthService(UserRepository(db))
    user, token = await service.register(
        email=user_in.email,
        password=user_in.password,
        full_name=user_in.full_name,
        phone=user_in.phone,
        gender=user_in.gender,
    )
    service.set_auth_cookie(response, token)
    return user


@router.post("/login", response_model=UserResponse)
async def login(user_in: UserLogin, db: DbSession, response: Response):
    service = AuthService(UserRepository(db))
    user, token = await service.login(email=user_in.email, password=user_in.password)
    service.set_auth_cookie(response, token)
    return user


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"detail": "Вы вышли из системы"}
