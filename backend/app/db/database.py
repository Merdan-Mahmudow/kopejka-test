from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings



engine = create_async_engine(
    settings.database_url, 
    echo=False,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "server_settings": {"jit": "off"},
    },
    pool_pre_ping=True,
    pool_recycle=300,      # Recycle connections every 5 min (Supabase closes idle ones)
    pool_size=5,           # Keep pool small for Supabase free tier
    max_overflow=5,        # Allow up to 10 total connections
    pool_timeout=30,
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
