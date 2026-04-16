from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form

from app.schemas.apartment import ApartmentResponse, ApartmentUpdate
from app.api.deps import DbSession, CurrentUser
from app.core.s3 import upload_files_to_s3
from app.repositories.apartment_repository import ApartmentRepository
from app.services.apartment_service import ApartmentService

router = APIRouter(prefix="/apartments", tags=["apartments"])


@router.get("/", response_model=List[ApartmentResponse])
async def get_apartments(db: DbSession, skip: int = 0, limit: int = 20):
    service = ApartmentService(ApartmentRepository(db))
    return await service.list_apartments(skip, limit)


@router.get("/{apartment_id}", response_model=ApartmentResponse)
async def get_apartment(apartment_id: str, db: DbSession):
    service = ApartmentService(ApartmentRepository(db))
    return await service.get_apartment(apartment_id)


@router.post("/", response_model=ApartmentResponse)
async def create_apartment(
    db: DbSession,
    current_user: CurrentUser,
    name: str = Form(...),
    address: str = Form(...),
    price: int = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File([]),
):
    photo_urls = await upload_files_to_s3(files)
    service = ApartmentService(ApartmentRepository(db))
    return await service.create_apartment(
        owner_id=current_user.id,
        name=name,
        address=address,
        price=price,
        description=description,
        photos=photo_urls,
    )


@router.patch("/{apartment_id}", response_model=ApartmentResponse)
async def update_apartment(
    apartment_id: str,
    apartment_in: ApartmentUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    service = ApartmentService(ApartmentRepository(db))
    data = apartment_in.model_dump(exclude_unset=True)
    return await service.update_apartment(apartment_id, str(current_user.id), data)


@router.delete("/{apartment_id}")
async def delete_apartment(
    apartment_id: str,
    db: DbSession,
    current_user: CurrentUser,
):
    service = ApartmentService(ApartmentRepository(db))
    await service.delete_apartment(apartment_id, str(current_user.id))
    return {"detail": "Объявление удалено"}
