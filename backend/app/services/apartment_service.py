from uuid import UUID
from fastapi import HTTPException

from app.repositories.apartment_repository import ApartmentRepository
from app.db.models import Apartment


class ApartmentService:
    """Business logic for Apartment management."""

    def __init__(self, repo: ApartmentRepository):
        self.repo = repo

    async def list_apartments(self, skip: int = 0, limit: int = 20) -> list[Apartment]:
        return await self.repo.get_all(skip, limit)

    async def get_apartment(self, apartment_id: str) -> Apartment:
        apt = await self.repo.get_by_id(apartment_id)
        if not apt:
            raise HTTPException(status_code=404, detail="Квартира не найдена")
        return apt

    async def create_apartment(
        self,
        owner_id: UUID,
        name: str,
        address: str,
        price: int,
        description: str | None,
        photos: list[str],
    ) -> Apartment:
        return await self.repo.create(
            owner_id=owner_id,
            name=name,
            address=address,
            price=price,
            description=description,
            photos=photos,
        )

    async def update_apartment(
        self, apartment_id: str, owner_id: str, data: dict
    ) -> Apartment:
        apt = await self.get_apartment(apartment_id)
        self._check_ownership(apt, owner_id)
        return await self.repo.update(apt, data)

    async def delete_apartment(self, apartment_id: str, owner_id: str) -> None:
        apt = await self.repo.get_by_id_bare(apartment_id)
        if not apt:
            raise HTTPException(status_code=404, detail="Квартира не найдена")
        self._check_ownership(apt, owner_id)
        await self.repo.delete(apt)

    @staticmethod
    def _check_ownership(apartment: Apartment, owner_id: str) -> None:
        if str(apartment.owner_id) != str(owner_id):
            raise HTTPException(status_code=403, detail="Недостаточно прав")
