from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel

class BookingBase(BaseModel):
    start_date: date
    end_date: date
    guest_name: str
    guest_phone: str

class BookingCreate(BookingBase):
    pass

class BookingResponse(BookingBase):
    id: UUID
    apartment_id: UUID
    user_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}

class BookingDates(BaseModel):
    start_date: date
    end_date: date

    model_config = {"from_attributes": True}
