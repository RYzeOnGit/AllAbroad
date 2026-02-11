-- PostgreSQL Database Setup Script for AllAbroad
-- Run this with: sudo -u postgres psql -f create_postgres_db.sql

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'allabroad_user') THEN
        CREATE USER allabroad_user WITH PASSWORD 'allabroad_password_2024';
    ELSE
        ALTER USER allabroad_user WITH PASSWORD 'allabroad_password_2024';
    END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE allabroad'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'allabroad')\gexec

-- Connect to the database
\c allabroad

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE allabroad TO allabroad_user;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO allabroad_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO allabroad_user;
GRANT CREATE ON SCHEMA public TO allabroad_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO allabroad_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO allabroad_user;

-- Show success message
SELECT 'Database and user created successfully!' AS status;

