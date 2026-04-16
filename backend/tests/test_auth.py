import pytest
from httpx import AsyncClient


# ─── Registration ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/auth/register", json={
        "email": "new@test.com",
        "password": "password123",
        "full_name": "Иван Иванов",
        "phone": "+79991112233",
        "gender": "Мужской",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "new@test.com"
    assert data["full_name"] == "Иван Иванов"
    assert "id" in data
    # Cookie must be set
    assert "access_token" in resp.cookies


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "dup@test.com",
        "password": "password123",
        "full_name": "Тест",
        "phone": "+79991112233",
        "gender": "Мужской",
    }
    await client.post("/auth/register", json=payload)
    resp = await client.post("/auth/register", json=payload)
    assert resp.status_code == 400
    assert "уже существует" in resp.json()["detail"]


# ─── Login ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    await client.post("/auth/register", json={
        "email": "login@test.com",
        "password": "password123",
        "full_name": "Тест",
        "phone": "+79991112233",
        "gender": "Мужской",
    })
    # Login
    resp = await client.post("/auth/login", json={
        "email": "login@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    assert resp.json()["email"] == "login@test.com"
    assert "access_token" in resp.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "wrong@test.com",
        "password": "password123",
        "full_name": "Тест",
        "phone": "+79991112233",
        "gender": "Мужской",
    })
    resp = await client.post("/auth/login", json={
        "email": "wrong@test.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 400
    assert "Неверный" in resp.json()["detail"]


# ─── Logout ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_logout(auth_client: AsyncClient):
    resp = await auth_client.post("/auth/logout")
    assert resp.status_code == 200


# ─── Unauthorized Access ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_endpoint_without_auth(client: AsyncClient):
    resp = await client.post("/apartments/", data={
        "name": "Тест",
        "address": "Тестовый адрес",
        "price": "1000",
    })
    assert resp.status_code == 401
