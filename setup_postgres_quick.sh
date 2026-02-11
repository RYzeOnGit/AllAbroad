#!/bin/bash
# Quick PostgreSQL Setup for AllAbroad

echo "Setting up PostgreSQL database for AllAbroad..."
echo ""

# Run the SQL script
sudo -u postgres psql -f create_postgres_db.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database setup complete!"
    echo ""
    echo "Update your .env file with:"
    echo "DATABASE_URL=postgresql://allabroad_user:allabroad_password_2024@localhost:5432/allabroad"
    echo ""
else
    echo ""
    echo "✗ Setup failed. You may need to run manually:"
    echo "  sudo -u postgres psql -f create_postgres_db.sql"
    echo ""
fi

