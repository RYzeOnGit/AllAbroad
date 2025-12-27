"""Database connection and session management."""
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

# Convert postgresql:// to postgresql+asyncpg:// for async support
# Handle both postgresql:// and postgresql+asyncpg:// formats
if settings.database_url.startswith("postgresql://"):
    database_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif settings.database_url.startswith("postgresql+asyncpg://"):
    database_url = settings.database_url
else:
    # For Supabase or other providers that might use different formats
    database_url = settings.database_url.replace("postgres://", "postgresql+asyncpg://", 1)

# Create async database engine
engine = create_async_engine(
    database_url,
    echo=settings.environment == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session():
    """Dependency for getting async database session."""
    async with async_session_maker() as session:
        yield session

