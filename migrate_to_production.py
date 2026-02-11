"""
Helper script to migrate data to production PostgreSQL database.

Usage:
    python migrate_to_production.py <production_database_url>

Example:
    python migrate_to_production.py "postgresql://user:pass@host:5432/dbname"
"""
import sys
import os

if len(sys.argv) < 2:
    print("Usage: python migrate_to_production.py <production_database_url>")
    print("\nExample:")
    print('  python migrate_to_production.py "postgresql://user:pass@dpg-xxxxx.render.com/allabroad"')
    sys.exit(1)

prod_url = sys.argv[1]

# Temporarily update .env or set environment variable
print(f"Setting DATABASE_URL to production database...")
print(f"Target: {prod_url.split('@')[1] if '@' in prod_url else prod_url}")
print()

# Set environment variable for this session
os.environ["DATABASE_URL"] = prod_url

# Now import and run the migration
print("Starting migration...")
print("=" * 60)

# Import the migration logic
import asyncio
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy import text, inspect, MetaData, Table
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel

# Import models
from app.models import (
    Lead, User,
    Student, Document, Application, Visa, Payment, Message, TimelineEvent,
    Destination, Testimonial, WhyUsCard, CtaTrustItem, HeroStat, SiteContent
)
from app.models.user import Admin, PendingApprovalUser

# Source SQLite database
SQLITE_DB_PATH = "allabroad.db"
if not os.path.exists(SQLITE_DB_PATH):
    print(f"ERROR: SQLite database not found at {SQLITE_DB_PATH}")
    print("Make sure you're running this from the project root directory.")
    sys.exit(1)

sqlite_url = f"sqlite+aiosqlite:///{SQLITE_DB_PATH}"

# Destination PostgreSQL database
if not prod_url.startswith("postgresql"):
    print("ERROR: DATABASE_URL must be a PostgreSQL connection string")
    print("Example: postgresql://user:password@host:5432/dbname")
    sys.exit(1)

if prod_url.startswith("postgresql://"):
    pg_url = prod_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif prod_url.startswith("postgresql+asyncpg://"):
    pg_url = prod_url
elif prod_url.startswith("postgres://"):
    pg_url = prod_url.replace("postgres://", "postgresql+asyncpg://", 1)
else:
    pg_url = prod_url

print(f"Source (SQLite): {SQLITE_DB_PATH}")
print(f"Destination (PostgreSQL): {pg_url.split('@')[1] if '@' in pg_url else pg_url}")
print()

# Create engines
sqlite_engine = create_async_engine(sqlite_url, echo=False)
pg_engine = create_async_engine(pg_url, echo=False)

# Get all models
MODELS = [
    Lead, User, Student, Admin, PendingApprovalUser,
    Document, Application, Visa, Payment, Message, TimelineEvent,
    Destination, Testimonial, WhyUsCard, CtaTrustItem, HeroStat, SiteContent
]

async def fetch_data_sqlite(model_class, session: AsyncSession) -> List[Dict[str, Any]]:
    """Fetch all data from SQLite for a model."""
    table_name = model_class.__tablename__
    result = await session.execute(text(f"SELECT * FROM {table_name}"))
    rows = result.fetchall()
    columns = result.keys()
    return [dict(zip(columns, row)) for row in rows]

async def insert_data_pg(model_class, data: List[Dict[str, Any]], session: AsyncSession):
    """Insert data into PostgreSQL."""
    if not data:
        return 0
    
    table_name = model_class.__tablename__
    inspector = inspect(pg_engine.sync_engine)
    
    # Get table columns
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    
    inserted = 0
    for row in data:
        try:
            # Filter out columns that don't exist in target table
            filtered_row = {k: v for k, v in row.items() if k in columns}
            
            # Convert datetime strings to datetime objects
            for key, value in filtered_row.items():
                if isinstance(value, str) and 'T' in value:
                    try:
                        filtered_row[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    except:
                        pass
            
            # Convert integer booleans to actual booleans
            for key, value in filtered_row.items():
                if isinstance(value, int) and key in ['is_active', 'is_verified', 'is_admin']:
                    filtered_row[key] = bool(value)
            
            # Handle foreign key references - set to NULL if referenced record doesn't exist
            foreign_key_columns = {
                'related_document_id': 'documents',
                'related_application_id': 'applications',
                'related_visa_id': 'visas',
                'related_payment_id': 'payments',
                'related_message_id': 'messages',
            }
            
            for fk_col, ref_table in foreign_key_columns.items():
                if fk_col in filtered_row and filtered_row[fk_col] is not None:
                    # Check if referenced record exists
                    check_query = text(f"SELECT id FROM {ref_table} WHERE id = :id")
                    result = await session.execute(check_query, {"id": filtered_row[fk_col]})
                    if result.fetchone() is None:
                        print(f"  Warning: {fk_col} references non-existent {ref_table} record {filtered_row[fk_col]}, setting to NULL")
                        filtered_row[fk_col] = None
            
            # Build insert statement
            cols = list(filtered_row.keys())
            values = [filtered_row[col] for col in cols]
            placeholders = ', '.join([f':{col}' for col in cols])
            col_names = ', '.join(cols)
            
            insert_query = text(f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})")
            await session.execute(insert_query, filtered_row)
            inserted += 1
        except Exception as e:
            print(f"  Error inserting row into {table_name}: {e}")
            print(f"  Row data: {filtered_row}")
            continue
    
    return inserted

async def reset_sequences(session: AsyncSession):
    """Reset PostgreSQL sequences to match max IDs."""
    tables_with_sequences = [
        'leads', 'users', 'students', 'admins', 'pending_approval_users',
        'documents', 'applications', 'visas', 'payments', 'messages', 'timeline_events',
        'destinations', 'testimonials', 'why_us_cards', 'cta_trust_items', 'hero_stats', 'site_contents'
    ]
    
    for table in tables_with_sequences:
        try:
            # Get max ID
            result = await session.execute(text(f"SELECT MAX(id) FROM {table}"))
            max_id = result.scalar()
            if max_id:
                # Reset sequence
                await session.execute(text(f"SELECT setval('{table}_id_seq', {max_id}, true)"))
        except Exception as e:
            # Table might not have a sequence or might be empty
            pass

async def main():
    """Main migration function."""
    print("=" * 60)
    print("MIGRATING TO PRODUCTION DATABASE")
    print("=" * 60)
    print()
    
    # Confirm
    print("⚠️  WARNING: This will migrate data to your PRODUCTION database!")
    print(f"Target: {pg_url.split('@')[1] if '@' in pg_url else pg_url}")
    response = input("\nContinue? (yes/no): ").strip().lower()
    if response != 'yes':
        print("Migration cancelled.")
        return
    
    print()
    print("Creating tables in PostgreSQL...")
    async with pg_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("✅ Tables created")
    print()
    
    # Check if data already exists
    async with AsyncSession(pg_engine) as session:
        result = await session.execute(text("SELECT COUNT(*) FROM users"))
        count = result.scalar()
        if count > 0:
            print(f"⚠️  WARNING: Database already has {count} users. Data may be duplicated.")
            response = input("Continue anyway? (yes/no): ").strip().lower()
            if response != 'yes':
                print("Migration cancelled.")
                return
            print()
    
    # Migrate each model
    async with AsyncSession(sqlite_engine) as sqlite_session:
        async with AsyncSession(pg_engine) as pg_session:
            for model_class in MODELS:
                table_name = model_class.__tablename__
                print(f"Migrating {table_name}...")
                
                # Fetch from SQLite
                data = await fetch_data_sqlite(model_class, sqlite_session)
                print(f"  Found {len(data)} records")
                
                if data:
                    # Insert into PostgreSQL
                    inserted = await insert_data_pg(model_class, data, pg_session)
                    await pg_session.commit()
                    print(f"  ✅ Inserted {inserted} records")
                else:
                    print(f"  ⏭️  No data to migrate")
                print()
    
    # Reset sequences
    print("Resetting sequences...")
    async with AsyncSession(pg_engine) as session:
        await reset_sequences(session)
        await session.commit()
    print("✅ Sequences reset")
    print()
    
    # Verify
    print("Verifying migration...")
    async with AsyncSession(sqlite_engine) as sqlite_session:
        async with AsyncSession(pg_engine) as pg_session:
            for model_class in MODELS:
                table_name = model_class.__tablename__
                
                sqlite_count = await sqlite_session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                pg_count = await pg_session.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                
                sqlite_num = sqlite_count.scalar()
                pg_num = pg_count.scalar()
                
                status = "✅" if sqlite_num == pg_num else "⚠️"
                print(f"  {status} {table_name}: SQLite={sqlite_num}, PostgreSQL={pg_num}")
    
    print()
    print("=" * 60)
    print("✅ MIGRATION COMPLETE!")
    print("=" * 60)
    
    # Close engines
    await sqlite_engine.dispose()
    await pg_engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())

