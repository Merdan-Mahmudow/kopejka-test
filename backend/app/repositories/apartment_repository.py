from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.models import Apartment


class ApartmentRepository:
    """Data Access Layer for Apartment entity."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 20) -> list[Apartment]:
        result = await self.db.execute(
            select(Apartment)
            .options(joinedload(Apartment.owner))
            .order_by(Apartment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id(self, apartment_id: str) -> Apartment | None:
        result = await self.db.execute(
            select(Apartment)
            .options(joinedload(Apartment.owner))
            .filter(Apartment.id == apartment_id)
        )
        return result.scalars().first()

    async def get_by_id_bare(self, apartment_id: str) -> Apartment | None:
        """Get apartment without joinedload (for ownership checks, deletes)."""
        result = await self.db.execute(
            select(Apartment).filter(Apartment.id == apartment_id)
        )
        return result.scalars().first()

    async def create(self, **kwargs) -> Apartment:
        apartment = Apartment(**kwargs)
        self.db.add(apartment)
        await self.db.commit()
        await self.db.refresh(apartment)
        # Re-fetch with owner loaded for response serialization
        return await self.get_by_id(str(apartment.id))

    async def update(self, apartment: Apartment, data: dict) -> Apartment:
        for field, value in data.items():
            setattr(apartment, field, value)
        await self.db.commit()
        # Re-fetch with owner loaded for response serialization
        return await self.get_by_id(str(apartment.id))

    async def delete(self, apartment: Apartment) -> None:
        await self.db.delete(apartment)
        await self.db.commit()
