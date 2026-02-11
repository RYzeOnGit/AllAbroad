"""
Migration script to migrate database from SQLite to PostgreSQL.

Usage:
1. Set up PostgreSQL database and update .env with:
   DATABASE_URL=postgresql://user:password@localhost:5432/allabroad

2. Run: python migrate_to_postgresql.py
"""
import asyncio
import sys
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy import text, inspect, MetaData, Table
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from app.config import settings
from app.models import (
    Lead, User,
    Student, Document, Application, Visa, Payment, Message, TimelineEvent,
    Destination, Testimonial, WhyUsCard, CtaTrustItem, HeroStat, SiteContent
)
# Import Admin and PendingApprovalUser directly since they're not exported in __init__.py
from app.models.user import Admin, PendingApprovalUser

# Source SQLite database
SQLITE_DB_PATH = "allabroad.db"
sqlite_url = f"sqlite+aiosqlite:///{SQLITE_DB_PATH}"

# Destination PostgreSQL database
raw_pg_url = settings.database_url
if not raw_pg_url.startswith("postgresql"):
    print("ERROR: DATABASE_URL in .env must be a PostgreSQL connection string")
    print("Example: postgresql://user:password@localhost:5432/allabroad")
    sys.exit(1)

if raw_pg_url.startswith("postgresql://"):
    pg_url = raw_pg_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif raw_pg_url.startswith("postgresql+asyncpg://"):
    pg_url = raw_pg_url
elif raw_pg_url.startswith("postgres://"):
    pg_url = raw_pg_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    pg_url = raw_pg_url

print(f"Source (SQLite): {SQLITE_DB_PATH}")
print(f"Destination (PostgreSQL): {pg_url.split('@')[1] if '@' in pg_url else pg_url}")
print()

# Create engines
sqlite_engine = create_async_engine(
    sqlite_url,
    echo=False,
    connect_args={"check_same_thread": False, "timeout": 10}
)

pg_engine = create_async_engine(
    pg_url,
    echo=False,
    pool_pre_ping=True
)

# Table order for migration (respecting foreign key dependencies)
TABLE_ORDER = [
    "admins",
    "users",
    "pending_approval_users",
    "leads",
    "students",
    "documents",
    "applications",
    "visas",
    "payments",
    "messages",
    "timeline_events",
    "destinations",
    "testimonials",
    "why_us_cards",
    "cta_trust_items",
    "hero_stats",
    "site_content",
]


async def get_table_columns(engine, table_name: str) -> List[str]:
    """Get column names for a table."""
    async with engine.connect() as conn:
        if engine.url.drivername.startswith("sqlite"):
            result = await conn.execute(text(f"PRAGMA table_info({table_name})"))
            rows = result.fetchall()
            return [row[1] for row in rows]  # Column name is at index 1
        else:
            # PostgreSQL
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = :table_name
                ORDER BY ordinal_position
            """), {"table_name": table_name})
            rows = result.fetchall()
            return [row[0] for row in rows]


async def get_pg_column_types(engine, table_name: str) -> Dict[str, str]:
    """Get column types for a PostgreSQL table."""
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = :table_name
        """), {"table_name": table_name})
        rows = result.fetchall()
        return {row[0]: row[1] for row in rows}  # column_name -> data_type


async def get_table_data(engine, table_name: str) -> List[Dict[str, Any]]:
    """Fetch all data from a table."""
    async with engine.connect() as conn:
        columns = await get_table_columns(engine, table_name)
        if not columns:
            return []
        
        # Get PostgreSQL column types if migrating to PostgreSQL
        pg_types = {}
        if not engine.url.drivername.startswith("sqlite"):
            pg_types = await get_pg_column_types(engine, table_name)
        
        # Build SELECT query
        col_list = ", ".join(columns)
        result = await conn.execute(text(f"SELECT {col_list} FROM {table_name}"))
        rows = result.fetchall()
        
        # Convert to list of dicts
        data = []
        for row in rows:
            row_dict = {}
            for i, col in enumerate(columns):
                value = row[i]
                
                # Handle None values
                if value is None:
                    row_dict[col] = None
                    continue
                
                # Handle bytes (BLOB) for PostgreSQL
                if isinstance(value, bytes):
                    row_dict[col] = value
                # Convert datetime strings to datetime objects for PostgreSQL
                elif pg_types.get(col) == 'timestamp with time zone' or pg_types.get(col) == 'timestamp without time zone':
                    if isinstance(value, str):
                        try:
                            # Try parsing various datetime formats
                            for fmt in ['%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                                try:
                                    row_dict[col] = datetime.strptime(value, fmt)
                                    break
                                except ValueError:
                                    continue
                            else:
                                # If all formats fail, keep as string (PostgreSQL will handle it)
                                row_dict[col] = value
                        except Exception:
                            row_dict[col] = value
                    else:
                        row_dict[col] = value
                # Convert integer booleans (0/1) to actual booleans for PostgreSQL
                elif pg_types.get(col) == 'boolean':
                    if isinstance(value, int):
                        row_dict[col] = bool(value)
                    elif isinstance(value, bool):
                        row_dict[col] = value
                    else:
                        row_dict[col] = value
                else:
                    row_dict[col] = value
            data.append(row_dict)
        
        return data


async def check_pg_has_data() -> bool:
    """Check if PostgreSQL database already has data."""
    async with pg_engine.connect() as conn:
        for table_name in TABLE_ORDER:
            if await check_table_exists(pg_engine, table_name):
                result = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                if count > 0:
                    return True
    return False


async def create_pg_tables():
    """Create all tables in PostgreSQL using SQLModel metadata."""
    print("Creating tables in PostgreSQL...")
    async with pg_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("✓ Tables created\n")


async def check_table_exists(engine, table_name: str) -> bool:
    """Check if a table exists."""
    async with engine.connect() as conn:
        if engine.url.drivername.startswith("sqlite"):
            result = await conn.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name=:table_name
            """), {"table_name": table_name})
        else:
            result = await conn.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_name = :table_name
            """), {"table_name": table_name})
        return result.fetchone() is not None


async def insert_data_pg(engine, table_name: str, data: List[Dict[str, Any]]):
    """Insert data into PostgreSQL table."""
    if not data:
        return 0
    
    async with engine.connect() as conn:
        columns = await get_table_columns(engine, table_name)
        if not columns:
            return 0
        
        # Get PostgreSQL column types for type conversion
        pg_types = await get_pg_column_types(engine, table_name)
        
        # Build INSERT statement
        col_list = ", ".join(columns)
        placeholders = ", ".join([f":{col}" for col in columns])
        insert_sql = f"INSERT INTO {table_name} ({col_list}) VALUES ({placeholders})"
        
        # Insert rows - validate FKs before insert
        inserted = 0
        for row in data:
            try:
                # Prepare row data - only include columns that exist in both source and destination
                row_data = {}
                for col in columns:
                    if col not in row:
                        continue
                    
                    value = row[col]
                    
                    # Convert datetime strings to datetime objects
                    if value is not None and (pg_types.get(col) == 'timestamp with time zone' or pg_types.get(col) == 'timestamp without time zone'):
                        if isinstance(value, str):
                            try:
                                for fmt in ['%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d']:
                                    try:
                                        value = datetime.strptime(value, fmt)
                                        break
                                    except ValueError:
                                        continue
                            except Exception:
                                pass  # Keep as string if parsing fails
                    
                    # Convert integer booleans to actual booleans
                    elif value is not None and pg_types.get(col) == 'boolean':
                        if isinstance(value, int):
                            value = bool(value)
                    
                    # Validate foreign keys for timeline_events
                    if table_name == 'timeline_events' and value is not None:
                        if col == 'related_application_id':
                            check = await conn.execute(text("SELECT 1 FROM applications WHERE id = :fk_id"), {"fk_id": value})
                            if check.fetchone() is None:
                                value = None
                                print(f"  ⚠ Warning: Row {row.get('id', 'unknown')} had invalid FK {col}, set to NULL")
                    
                    row_data[col] = value
                
                await conn.execute(text(insert_sql), row_data)
                inserted += 1
            except Exception as e:
                print(f"  ⚠ Warning: Failed to insert row {row.get('id', 'unknown')}: {e}")
                continue
        
        await conn.commit()
        return inserted


async def migrate_table(table_name: str):
    """Migrate a single table from SQLite to PostgreSQL."""
    print(f"Migrating {table_name}...")
    
    # Check if source table exists
    if not await check_table_exists(sqlite_engine, table_name):
        print(f"  ⚠ Source table {table_name} does not exist, skipping")
        return
    
    # Check if destination table exists
    if not await check_table_exists(pg_engine, table_name):
        print(f"  ⚠ Destination table {table_name} does not exist, skipping")
        return
    
    # Get data from SQLite
    data = await get_table_data(sqlite_engine, table_name)
    
    if not data:
        print(f"  ✓ No data to migrate")
        return
    
    # Insert into PostgreSQL
    inserted = await insert_data_pg(pg_engine, table_name, data)
    print(f"  ✓ Migrated {inserted}/{len(data)} rows")


async def reset_sequences():
    """Reset PostgreSQL sequences after migration."""
    print("\nResetting sequences...")
    async with pg_engine.connect() as conn:
        # Get all tables with sequences
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """))
        tables = [row[0] for row in result.fetchall()]
        
        for table in tables:
            try:
                # Reset sequence to max(id) + 1
                await conn.execute(text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{table}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {table}), 1),
                        true
                    )
                """))
            except Exception:
                # Table might not have an id column or sequence
                pass
        
        await conn.commit()
    print("✓ Sequences reset\n")


async def verify_migration():
    """Verify migration by comparing row counts."""
    print("Verifying migration...")
    mismatches = []
    
    for table_name in TABLE_ORDER:
        if not await check_table_exists(sqlite_engine, table_name):
            continue
        if not await check_table_exists(pg_engine, table_name):
            continue
        
        async with sqlite_engine.connect() as conn:
            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            sqlite_count = result.scalar()
        
        async with pg_engine.connect() as conn:
            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            pg_count = result.scalar()
        
        if sqlite_count != pg_count:
            mismatches.append((table_name, sqlite_count, pg_count))
        else:
            print(f"  ✓ {table_name}: {sqlite_count} rows")
    
    if mismatches:
        print("\n⚠ Mismatches found:")
        for table, sqlite_count, pg_count in mismatches:
            print(f"  {table}: SQLite={sqlite_count}, PostgreSQL={pg_count}")
    else:
        print("\n✓ All tables migrated successfully!")


async def main():
    """Main migration function."""
    print("=" * 60)
    print("SQLite to PostgreSQL Migration")
    print("=" * 60)
    print()
    
    # Test connections
    print("Testing connections...")
    try:
        async with sqlite_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("✓ SQLite connection OK")
    except Exception as e:
        print(f"✗ SQLite connection failed: {e}")
        return
    
    try:
        async with pg_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("✓ PostgreSQL connection OK")
    except Exception as e:
        print(f"✗ PostgreSQL connection failed: {e}")
        print("\nMake sure:")
        print("1. PostgreSQL is running")
        print("2. Database exists")
        print("3. DATABASE_URL in .env is correct")
        print("4. User has CREATE TABLE permissions")
        return
    
    print()
    
    # Check if PostgreSQL already has data
    if await check_pg_has_data():
        print("⚠ WARNING: PostgreSQL database already contains data!")
        try:
            response = input("Do you want to continue? This may create duplicate data. (yes/no): ")
            if response.lower() not in ['yes', 'y']:
                print("Migration cancelled.")
                return
        except EOFError:
            # Non-interactive mode - proceed anyway
            print("Non-interactive mode: proceeding with migration...")
        print()
    
    # Create tables
    await create_pg_tables()
    
    # Migrate data
    print("Migrating data...")
    for table_name in TABLE_ORDER:
        await migrate_table(table_name)
    
    print()
    
    # Reset sequences
    await reset_sequences()
    
    # Verify
    await verify_migration()
    
    print("\n" + "=" * 60)
    print("Migration complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Update your .env file to use the PostgreSQL DATABASE_URL")
    print("2. Restart your application")
    print("3. Test the application to ensure everything works")
    print("4. Keep a backup of your SQLite database until you're confident")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nMigration cancelled by user")
    except Exception as e:
        print(f"\n\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()

