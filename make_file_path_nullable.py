"""
Migration script to make file_path nullable in documents table.
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.config import settings

# Get database URL
raw_url = settings.database_url
if raw_url.startswith("postgresql://"):
    database_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql+asyncpg://"):
    database_url = raw_url
elif raw_url.startswith("postgres://"):
    database_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    database_url = raw_url

# Create engine
connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 10}

engine = create_async_engine(database_url, echo=True, connect_args=connect_args)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def migrate():
    """Make file_path nullable in documents table."""
    async with engine.begin() as conn:
        if database_url.startswith("sqlite"):
            # SQLite doesn't support ALTER COLUMN directly, need to recreate table
            print("SQLite detected - recreating table to make file_path nullable...")
            
            # Check if file_path is already nullable
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM pragma_table_info('documents') 
                WHERE name='file_path' AND "notnull"=0
            """))
            row = result.fetchone()
            is_nullable = row[0] > 0 if row else False
            
            if is_nullable:
                print("✓ file_path is already nullable")
                return
            
            # Check if documents_new exists from previous failed migration
            result = await conn.execute(text("""
                SELECT name FROM sqlite_master WHERE type='table' AND name='documents_new'
            """))
            if result.fetchone():
                print("Cleaning up previous migration attempt...")
                await conn.execute(text("DROP TABLE documents_new"))
            
            # SQLite workaround: create new table, copy data, drop old, rename new
            print("Creating new table structure...")
            await conn.execute(text("""
                CREATE TABLE documents_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL,
                    document_type VARCHAR(100) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_path VARCHAR(500),
                    file_content BLOB,
                    file_size INTEGER,
                    mime_type VARCHAR(100),
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    counselor_comment TEXT,
                    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    reviewed_at DATETIME,
                    reviewed_by INTEGER,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME,
                    FOREIGN KEY(student_id) REFERENCES students(id),
                    FOREIGN KEY(reviewed_by) REFERENCES users(id)
                )
            """))
            
            print("Copying data to new table...")
            await conn.execute(text("""
                INSERT INTO documents_new 
                (id, student_id, document_type, file_name, file_path, file_content, file_size, mime_type, status, counselor_comment, uploaded_at, reviewed_at, reviewed_by, created_at, updated_at)
                SELECT 
                    id, student_id, document_type, file_name, file_path, file_content, file_size, mime_type, 
                    COALESCE(status, 'pending') as status,
                    counselor_comment, uploaded_at, reviewed_at, reviewed_by, created_at, updated_at
                FROM documents
            """))
            
            print("Dropping old table...")
            await conn.execute(text("DROP TABLE documents"))
            
            print("Renaming new table...")
            await conn.execute(text("ALTER TABLE documents_new RENAME TO documents"))
            
            print("✓ Migration complete - file_path is now nullable")
        else:
            # PostgreSQL
            print("PostgreSQL detected - altering column...")
            await conn.execute(text("ALTER TABLE documents ALTER COLUMN file_path DROP NOT NULL"))
            print("✓ Migration complete - file_path is now nullable")


if __name__ == "__main__":
    print("Starting file_path nullable migration...")
    asyncio.run(migrate())
    print("\nDone!")

