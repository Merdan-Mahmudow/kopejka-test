from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import User
from app.core.config import settings

DbSession = Annotated[AsyncSession, Depends(get_db)]

def get_token_from_cookie(request: Request) -> str | None:
    return request.cookies.get("access_token")

async def get_current_user(
    request: Request,
    db: DbSession
) -> User:
    token = get_token_from_cookie(request)
    if not token:
        # FastAPI's OAuth2 scheme would normally handle this, 
        # but since we are using HTTPOnly cookies, we parse it ourselves.
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token[7:]
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация",
        )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительный токен")
    
    result = await db.execute(select(User).filter(User.id == user_id_str))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]
