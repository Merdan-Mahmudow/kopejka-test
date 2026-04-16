import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.db.database import Base, get_db


# ─── In-memory SQLite for tests ───────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Async HTTP client for testing FastAPI endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient):
    """Client that is already registered and logged in (cookies set)."""
    resp = await client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "test123456",
        "full_name": "Тестовый Пользователь",
        "phone": "+79991234567",
        "gender": "Мужской",
    })
    assert resp.status_code == 200
    # Cookies are auto-attached to subsequent requests
    return client


@pytest_asyncio.fixture
async def second_auth_client(client: AsyncClient):
    """A second logged-in user for permission tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/auth/register", json={
            "email": "other@example.com",
            "password": "other123456",
            "full_name": "Другой Пользователь",
            "phone": "+79990000000",
            "gender": "Женский",
        })
        assert resp.status_code == 200
        yield ac
