from typing import List
from fastapi import APIRouter

from app.schemas.booking import BookingCreate, BookingResponse, BookingDates
from app.api.deps import DbSession, CurrentUser
from app.repositories.booking_repository import BookingRepository
from app.repositories.apartment_repository import ApartmentRepository
from app.services.booking_service import BookingService

router = APIRouter(prefix="", tags=["bookings"])


def _make_service(db) -> BookingService:
    return BookingService(BookingRepository(db), ApartmentRepository(db))


@router.post("/apartments/{apartment_id}/book", response_model=BookingResponse)
async def create_booking(
    apartment_id: str,
    booking_in: BookingCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    service = _make_service(db)
    return await service.create_booking(apartment_id, current_user.id, booking_in)


@router.get("/apartments/{apartment_id}/bookings", response_model=List[BookingDates])
async def get_apartment_bookings(apartment_id: str, db: DbSession):
    service = _make_service(db)
    return await service.get_apartment_bookings(apartment_id)


@router.get(
    "/apartments/{apartment_id}/bookings/owner", response_model=List[BookingResponse]
)
async def get_owner_apartment_bookings(
    apartment_id: str, db: DbSession, current_user: CurrentUser
):
    service = _make_service(db)
    return await service.get_owner_bookings(apartment_id, str(current_user.id))


@router.get("/user/bookings", response_model=List[BookingResponse])
async def get_my_bookings(db: DbSession, current_user: CurrentUser):
    service = _make_service(db)
    return await service.get_user_bookings(str(current_user.id))
