from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    gender: str

class UserCreate(UserBase):
    password: str = Field(..., max_length=72)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    model_config = {"from_attributes": True}

class UserPublic(BaseModel):
    id: UUID
    full_name: str
    phone: str
    
    model_config = {"from_attributes": True}
