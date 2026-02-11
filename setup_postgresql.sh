#!/bin/bash
# PostgreSQL Setup Script for AllAbroad Migration

echo "=========================================="
echo "PostgreSQL Setup for AllAbroad"
echo "=========================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed."
    echo ""
    echo "Install PostgreSQL:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  macOS:        brew install postgresql"
    echo "  Windows:      Download from https://www.postgresql.org/download/"
    exit 1
fi

echo "✓ PostgreSQL is installed"
echo ""

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "⚠ PostgreSQL is not running."
    echo "Start PostgreSQL:"
    echo "  Linux:   sudo systemctl start postgresql"
    echo "  macOS:   brew services start postgresql"
    exit 1
fi

echo "✓ PostgreSQL is running"
echo ""

# Get database name
read -p "Enter database name (default: allabroad): " DB_NAME
DB_NAME=${DB_NAME:-allabroad}

# Get username
read -p "Enter PostgreSQL username (default: allabroad_user): " DB_USER
DB_USER=${DB_USER:-allabroad_user}

# Get password
read -sp "Enter password for user '$DB_USER': " DB_PASSWORD
echo ""

# Get host (default: localhost)
read -p "Enter PostgreSQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

# Get port (default: 5432)
read -p "Enter PostgreSQL port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "Creating database and user..."

# Connect as postgres superuser to create database and user
sudo -u postgres psql << EOF
-- Create user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    ELSE
        ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

if [ $? -eq 0 ]; then
    echo "✓ Database and user created successfully"
    echo ""
    echo "=========================================="
    echo "Add this to your .env file:"
    echo "=========================================="
    echo ""
    echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""
    echo "=========================================="
    echo ""
    echo "After updating .env, run:"
    echo "  python migrate_to_postgresql.py"
    echo ""
else
    echo "✗ Failed to create database/user"
    echo "You may need to run this script with sudo or as postgres user"
    exit 1
fi

