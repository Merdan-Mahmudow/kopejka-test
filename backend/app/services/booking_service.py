from uuid import UUID
from fastapi import HTTPException, status

from app.repositories.booking_repository import BookingRepository
from app.repositories.apartment_repository import ApartmentRepository
from app.schemas.booking import BookingCreate
from app.db.models import Booking


class BookingService:
    """Business logic for Booking management."""

    def __init__(
        self, booking_repo: BookingRepository, apartment_repo: ApartmentRepository
    ):
        self.booking_repo = booking_repo
        self.apartment_repo = apartment_repo

    async def create_booking(
        self, apartment_id: str, user_id: UUID, booking_in: BookingCreate
    ) -> Booking:
        # 1. Check apartment exists
        apartment = await self.apartment_repo.get_by_id_bare(apartment_id)
        if not apartment:
            raise HTTPException(status_code=404, detail="Квартира не найдена")

        # 2. Prevent self-booking
        if str(apartment.owner_id) == str(user_id):
            raise HTTPException(
                status_code=400, detail="Нельзя забронировать собственную квартиру"
            )

        # 3. Validate dates
        if booking_in.start_date >= booking_in.end_date:
            raise HTTPException(
                status_code=400, detail="Дата заезда должна быть раньше даты выезда"
            )

        # 4. Check overlap
        overlap = await self.booking_repo.check_overlap(
            apartment_id, booking_in.start_date, booking_in.end_date
        )
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Апартаменты уже забронированы на эти даты.",
            )

        # 5. Create
        return await self.booking_repo.create(
            apartment_id=apartment.id,
            user_id=user_id,
            start_date=booking_in.start_date,
            end_date=booking_in.end_date,
            guest_name=booking_in.guest_name,
            guest_phone=booking_in.guest_phone,
        )

    async def get_apartment_bookings(self, apartment_id: str) -> list[Booking]:
        return await self.booking_repo.get_by_apartment(apartment_id)

    async def get_owner_bookings(
        self, apartment_id: str, owner_id: str
    ) -> list[Booking]:
        apartment = await self.apartment_repo.get_by_id_bare(apartment_id)
        if not apartment:
            raise HTTPException(status_code=404, detail="Квартира не найдена")
        if str(apartment.owner_id) != str(owner_id):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        return await self.booking_repo.get_by_apartment_ordered(apartment_id)

    async def get_user_bookings(self, user_id: str) -> list[Booking]:
        return await self.booking_repo.get_by_user(user_id)
