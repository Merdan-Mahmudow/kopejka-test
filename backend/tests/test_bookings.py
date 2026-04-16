import pytest
from httpx import AsyncClient


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def create_apartment(client: AsyncClient) -> dict:
    resp = await client.post("/apartments/", data={
        "name": "Квартира для бронирования",
        "address": "г. Москва, ул. Ленина, д. 5",
        "price": "2000",
    })
    assert resp.status_code == 200
    return resp.json()


# ─── Booking CRUD ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_booking(auth_client: AsyncClient, second_auth_client: AsyncClient):
    apt = await create_apartment(auth_client)

    # Second user books first user's apartment
    resp = await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-06-01",
        "end_date": "2026-06-05",
        "guest_name": "Гость Тестовый",
        "guest_phone": "+79990001122",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["guest_name"] == "Гость Тестовый"
    assert data["apartment_id"] == apt["id"]


@pytest.mark.asyncio
async def test_get_apartment_bookings(auth_client: AsyncClient, second_auth_client: AsyncClient):
    apt = await create_apartment(auth_client)
    await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-07-01",
        "end_date": "2026-07-03",
        "guest_name": "Гость",
        "guest_phone": "+79990001122",
    })

    resp = await auth_client.get(f"/apartments/{apt['id']}/bookings")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_get_my_bookings(auth_client: AsyncClient, second_auth_client: AsyncClient):
    apt = await create_apartment(auth_client)
    await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-08-01",
        "end_date": "2026-08-05",
        "guest_name": "Второй гость",
        "guest_phone": "+79990001122",
    })

    resp = await second_auth_client.get("/user/bookings")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ─── Business Rules ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_self_booking_forbidden(auth_client: AsyncClient):
    """Owner cannot book their own apartment."""
    apt = await create_apartment(auth_client)

    resp = await auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "guest_name": "Я сам",
        "guest_phone": "+79990001122",
    })
    assert resp.status_code == 400
    assert "собственную" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_invalid_dates(auth_client: AsyncClient, second_auth_client: AsyncClient):
    """End date must be after start date."""
    apt = await create_apartment(auth_client)

    resp = await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-10-05",
        "end_date": "2026-10-01",
        "guest_name": "Тест",
        "guest_phone": "+79990001122",
    })
    assert resp.status_code == 400
    assert "раньше" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_overlapping_booking(auth_client: AsyncClient, second_auth_client: AsyncClient):
    """Overlapping dates must be rejected."""
    apt = await create_apartment(auth_client)

    # First booking: June 10-15
    await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-06-10",
        "end_date": "2026-06-15",
        "guest_name": "Гость 1",
        "guest_phone": "+79990001122",
    })

    # Overlapping booking: June 13-18
    resp = await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-06-13",
        "end_date": "2026-06-18",
        "guest_name": "Гость 2",
        "guest_phone": "+79990001122",
    })
    assert resp.status_code == 409
    assert "забронированы" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_non_overlapping_booking(auth_client: AsyncClient, second_auth_client: AsyncClient):
    """Adjacent dates should be allowed (checkout day = next checkin day)."""
    apt = await create_apartment(auth_client)

    await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-11-01",
        "end_date": "2026-11-05",
        "guest_name": "Гость 1",
        "guest_phone": "+79990001122",
    })

    # Next booking starts on checkout day — should be OK
    resp = await second_auth_client.post(f"/apartments/{apt['id']}/book", json={
        "start_date": "2026-11-05",
        "end_date": "2026-11-10",
        "guest_name": "Гость 2",
        "guest_phone": "+79990001122",
    })
    assert resp.status_code == 200


# ─── Owner Bookings Permission ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_owner_bookings_forbidden(auth_client: AsyncClient, second_auth_client: AsyncClient):
    """Non-owner cannot view owner's booking list."""
    apt = await create_apartment(auth_client)

    resp = await second_auth_client.get(f"/apartments/{apt['id']}/bookings/owner")
    assert resp.status_code == 403
