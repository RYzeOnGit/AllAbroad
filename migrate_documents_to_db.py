"""
Migration script to add file_content column to documents table
and optionally migrate existing files from file system to database.
"""
import asyncio
import os
import sys
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
    """Add file_content column and migrate existing files."""
    async with engine.begin() as conn:
        # Check if column already exists
        if database_url.startswith("sqlite"):
            # SQLite
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM pragma_table_info('documents') WHERE name='file_content'
            """))
            row = result.fetchone()
            column_exists = row[0] > 0 if row else False
        else:
            # PostgreSQL
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_name='documents' AND column_name='file_content'
            """))
            row = result.fetchone()
            column_exists = row[0] > 0 if row else False
        
        if not column_exists:
            print("Adding file_content column to documents table...")
            if database_url.startswith("sqlite"):
                await conn.execute(text("ALTER TABLE documents ADD COLUMN file_content BLOB"))
            else:
                await conn.execute(text("ALTER TABLE documents ADD COLUMN file_content BYTEA"))
            print("✓ Column added successfully")
        else:
            print("✓ file_content column already exists")
    
    # Migrate existing files from file system to database
    async with async_session_maker() as session:
        # Get all documents with file_path but no file_content
        result = await session.execute(text("""
            SELECT id, file_path, file_name FROM documents 
            WHERE file_path IS NOT NULL AND file_path != '' 
            AND (file_content IS NULL OR file_content = '')
        """))
        documents = result.fetchall()
        
        if not documents:
            print("✓ No documents to migrate")
            return
        
        print(f"\nFound {len(documents)} documents to migrate...")
        migrated = 0
        failed = 0
        
        for doc_id, file_path, file_name in documents:
            try:
                # Convert to absolute path if relative
                if not os.path.isabs(file_path):
                    # Try to resolve relative to project root
                    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    file_path = os.path.join(project_root, file_path)
                    if not os.path.exists(file_path):
                        # Try uploads directory
                        uploads_dir = os.path.join(project_root, "uploads", "documents")
                        file_path = os.path.join(uploads_dir, os.path.basename(file_path))
                
                if os.path.exists(file_path):
                    with open(file_path, "rb") as f:
                        file_content = f.read()
                    
                    # Update document with file content
                    await session.execute(text("""
                        UPDATE documents 
                        SET file_content = :content 
                        WHERE id = :doc_id
                    """), {"content": file_content, "doc_id": doc_id})
                    await session.commit()
                    migrated += 1
                    print(f"  ✓ Migrated: {file_name} ({len(file_content)} bytes)")
                else:
                    print(f"  ✗ File not found: {file_path}")
                    failed += 1
            except Exception as e:
                print(f"  ✗ Error migrating {file_name}: {e}")
                failed += 1
                await session.rollback()
        
        print(f"\n✓ Migration complete: {migrated} migrated, {failed} failed")


if __name__ == "__main__":
    print("Starting document migration...")
    asyncio.run(migrate())
    print("\nDone!")

