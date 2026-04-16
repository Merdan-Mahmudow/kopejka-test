from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.schemas.user import UserPublic

class ApartmentBase(BaseModel):
    name: str
    address: str
    description: Optional[str] = None
    price: int
    photos: list[str] = []

class ApartmentCreate(ApartmentBase):
    pass

class ApartmentUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    price: Optional[int] = None
    description: Optional[str] = None

class ApartmentResponse(ApartmentBase):
    id: UUID
    owner_id: UUID
    owner: UserPublic
    created_at: datetime

    model_config = {"from_attributes": True}
