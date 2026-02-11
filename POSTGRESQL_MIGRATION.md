# PostgreSQL Migration Guide

This guide will help you migrate your database from SQLite to PostgreSQL.

## Prerequisites

1. **PostgreSQL installed and running**
   - On Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - On macOS: `brew install postgresql` or download from [postgresql.org](https://www.postgresql.org/download/)
   - On Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. **Create a PostgreSQL database**
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE allabroad;
   CREATE USER allabroad_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE allabroad TO allabroad_user;
   \q
   ```

## Migration Steps

### Step 1: Update .env File

Update your `.env` file to include the PostgreSQL connection string:

```bash
# Old (SQLite):
# DATABASE_URL=sqlite+aiosqlite:///./allabroad.db

# New (PostgreSQL):
DATABASE_URL=postgresql://allabroad_user:your_secure_password@localhost:5432/allabroad
```

**Format:** `postgresql://username:password@host:port/database_name`

### Step 2: Run the Migration Script

```bash
# Activate virtual environment
source venv/bin/activate

# Run migration
python migrate_to_postgresql.py
```

The script will:
1. ✅ Test connections to both databases
2. ✅ Create all tables in PostgreSQL
3. ✅ Migrate all data from SQLite to PostgreSQL
4. ✅ Reset sequences (auto-increment IDs)
5. ✅ Verify migration by comparing row counts

### Step 3: Verify Migration

After migration, the script will show:
- Row counts for each table
- Any mismatches between SQLite and PostgreSQL

### Step 4: Test Your Application

1. **Start your application:**
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Test key functionality:**
   - Login (admin/student)
   - View leads
   - Upload documents
   - Create applications
   - View messages

### Step 5: Backup SQLite (Optional)

Keep your SQLite database as a backup until you're confident everything works:

```bash
cp allabroad.db allabroad.db.backup
```

## Troubleshooting

### Connection Issues

**Error: "connection failed"**
- Check PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or `brew services list` (macOS)
- Verify database exists: `psql -U allabroad_user -d allabroad -c "SELECT 1;"`
- Check credentials in `.env` file

**Error: "permission denied"**
- Grant privileges: `GRANT ALL PRIVILEGES ON DATABASE allabroad TO allabroad_user;`
- For tables: `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO allabroad_user;`

### Data Type Issues

The migration script handles:
- ✅ BLOB data (PDF files in `documents.file_content`)
- ✅ Datetime/timezone conversions
- ✅ NULL values
- ✅ Foreign key relationships

### Missing Tables

If a table doesn't exist in SQLite, it will be skipped. This is normal for new installations.

## Production Deployment

For production (e.g., Render, Heroku, AWS):

1. **Use a managed PostgreSQL service:**
   - [Supabase](https://supabase.com) (free tier available)
   - [Render PostgreSQL](https://render.com/docs/databases)
   - [AWS RDS](https://aws.amazon.com/rds/)
   - [Heroku Postgres](https://www.heroku.com/postgres)

2. **Get connection string from your provider:**
   ```
   postgresql://user:password@host:port/database
   ```

3. **Update DATABASE_URL in your deployment environment variables**

4. **Run migration script locally pointing to production DB** (or use a migration tool)

## Rollback

If you need to rollback to SQLite:

1. Update `.env`:
   ```bash
   DATABASE_URL=sqlite+aiosqlite:///./allabroad.db
   ```

2. Restart application

Your SQLite database file (`allabroad.db`) remains unchanged during migration.

## Notes

- The migration script preserves all data including binary PDF files
- Foreign key relationships are maintained
- Auto-increment sequences are reset to continue from the highest ID
- The original SQLite database is not modified
- Migration can be run multiple times (will create duplicate data if run again)

