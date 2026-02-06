"""Database connection and session management."""
from sqlmodel import SQLModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

raw_url = settings.database_url

# Support both Postgres (asyncpg) and SQLite (aiosqlite) for local dev
if raw_url.startswith("postgresql://"):
    database_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql+asyncpg://"):
    database_url = raw_url
elif raw_url.startswith("postgres://"):
    database_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    # Assume URL is already a fully-qualified async SQLAlchemy URL (e.g. sqlite+aiosqlite:///./allabroad.db)
    database_url = raw_url

# Create async database engine
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 10}

engine = create_async_engine(
    database_url,
    echo=settings.environment == "development",
    pool_pre_ping=True,
    connect_args=connect_args,
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


async def ensure_testimonials_image_column():
    """Add testimonials.image column if missing (e.g. DB created before the field existed)."""
    try:
        async with engine.connect() as c:
            r = await c.execute(text("SELECT 1 FROM pragma_table_info('testimonials') WHERE name='image'"))
            if r.fetchone() is not None:
                return
        async with engine.begin() as c:
            await c.execute(text("ALTER TABLE testimonials ADD COLUMN image VARCHAR(20) DEFAULT ''"))
    except Exception:
        pass


async def get_session():
    """Dependency for getting async database session."""
    async with async_session_maker() as session:
        yield session

