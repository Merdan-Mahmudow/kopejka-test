from fastapi import HTTPException, status

from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.db.models import User

from datetime import timedelta


class AuthService:
    """Business logic for authentication."""

    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def register(self, email: str, password: str, full_name: str, phone: str, gender: str) -> tuple[User, str]:
        """Register a new user. Returns (user, access_token)."""
        existing = await self.user_repo.find_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email уже существует",
            )

        user = await self.user_repo.create(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            gender=gender,
        )

        token = self._create_token(user)
        return user, token

    async def login(self, email: str, password: str) -> tuple[User, str]:
        """Authenticate user. Returns (user, access_token)."""
        user = await self.user_repo.find_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверный email или пароль",
            )

        token = self._create_token(user)
        return user, token

    @staticmethod
    def _create_token(user: User) -> str:
        expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        return create_access_token(data={"sub": str(user.id)}, expires_delta=expires)

    @staticmethod
    def set_auth_cookie(response, token: str) -> None:
        """Set HTTPOnly auth cookie on the response."""
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
        )
