from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Booking


class BookingRepository:
    """Data Access Layer for Booking entity."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_apartment(self, apartment_id: str) -> list[Booking]:
        result = await self.db.execute(
            select(Booking).filter(Booking.apartment_id == apartment_id)
        )
        return list(result.scalars().all())

    async def get_by_apartment_ordered(self, apartment_id: str) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .filter(Booking.apartment_id == apartment_id)
            .order_by(Booking.start_date.desc())
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: str) -> list[Booking]:
        result = await self.db.execute(
            select(Booking)
            .filter(Booking.user_id == user_id)
            .order_by(Booking.start_date.desc())
        )
        return list(result.scalars().all())

    async def check_overlap(
        self, apartment_id: str, start_date: date, end_date: date
    ) -> Booking | None:
        """Check for overlapping bookings with row-level lock."""
        result = await self.db.execute(
            select(Booking)
            .filter(
                Booking.apartment_id == apartment_id,
                Booking.start_date < end_date,
                Booking.end_date > start_date,
            )
            .with_for_update()
        )
        return result.scalars().first()

    async def create(self, **kwargs) -> Booking:
        booking = Booking(**kwargs)
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        return booking
