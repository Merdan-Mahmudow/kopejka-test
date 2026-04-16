import pytest
from httpx import AsyncClient


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def create_apartment(client: AsyncClient) -> dict:
    """Helper to create an apartment and return its JSON."""
    resp = await client.post("/apartments/", data={
        "name": "Уютная квартира в центре",
        "address": "г. Москва, ул. Тверская, д. 1",
        "price": "3000",
        "description": "Прекрасный вид из окна",
    })
    assert resp.status_code == 200
    return resp.json()


# ─── CRUD ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_apartment(auth_client: AsyncClient):
    apt = await create_apartment(auth_client)
    assert apt["name"] == "Уютная квартира в центре"
    assert apt["price"] == 3000
    assert apt["address"] == "г. Москва, ул. Тверская, д. 1"
    assert "id" in apt


@pytest.mark.asyncio
async def test_list_apartments(auth_client: AsyncClient):
    await create_apartment(auth_client)
    await create_apartment(auth_client)

    resp = await auth_client.get("/apartments/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


@pytest.mark.asyncio
async def test_get_apartment_by_id(auth_client: AsyncClient):
    apt = await create_apartment(auth_client)

    resp = await auth_client.get(f"/apartments/{apt['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == apt["id"]


@pytest.mark.asyncio
async def test_get_apartment_not_found(client: AsyncClient):
    resp = await client.get("/apartments/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_apartment(auth_client: AsyncClient):
    apt = await create_apartment(auth_client)

    resp = await auth_client.patch(f"/apartments/{apt['id']}", json={
        "name": "Новое название",
        "price": 5000,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Новое название"
    assert data["price"] == 5000
    # Address should remain unchanged
    assert data["address"] == "г. Москва, ул. Тверская, д. 1"


@pytest.mark.asyncio
async def test_delete_apartment(auth_client: AsyncClient):
    apt = await create_apartment(auth_client)

    resp = await auth_client.delete(f"/apartments/{apt['id']}")
    assert resp.status_code == 200

    # Should be gone
    resp = await auth_client.get(f"/apartments/{apt['id']}")
    assert resp.status_code == 404


# ─── Pagination ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_pagination(auth_client: AsyncClient):
    for i in range(5):
        await auth_client.post("/apartments/", data={
            "name": f"Квартира {i}",
            "address": f"Адрес {i}",
            "price": "1000",
        })

    resp = await auth_client.get("/apartments/?skip=0&limit=2")
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    resp = await auth_client.get("/apartments/?skip=4&limit=10")
    assert resp.status_code == 200
    assert len(resp.json()) == 1


# ─── Permissions ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_apartment_forbidden(auth_client: AsyncClient, second_auth_client: AsyncClient):
    apt = await create_apartment(auth_client)

    # Second user tries to update first user's apartment
    resp = await second_auth_client.patch(f"/apartments/{apt['id']}", json={
        "name": "Хак",
    })
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_apartment_forbidden(auth_client: AsyncClient, second_auth_client: AsyncClient):
    apt = await create_apartment(auth_client)

    resp = await second_auth_client.delete(f"/apartments/{apt['id']}")
    assert resp.status_code == 403
