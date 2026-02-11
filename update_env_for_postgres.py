#!/usr/bin/env python3
"""Update .env file to use PostgreSQL connection string."""
import re
import os

ENV_FILE = ".env"
PG_URL = "postgresql://allabroad_user:allabroad_password_2024@localhost:5432/allabroad"

def update_env_file():
    """Update DATABASE_URL in .env file."""
    if not os.path.exists(ENV_FILE):
        print(f"✗ {ENV_FILE} file not found")
        return False
    
    # Read current file
    with open(ENV_FILE, 'r') as f:
        lines = f.readlines()
    
    # Find and update DATABASE_URL lines
    updated = False
    new_lines = []
    found_pg_url = False
    
    for line in lines:
        if line.strip().startswith('DATABASE_URL='):
            # Check if it's already the PostgreSQL URL
            if 'postgresql://' in line:
                if PG_URL in line:
                    print("✓ .env already has correct PostgreSQL URL")
                    return True
                # Replace with correct PostgreSQL URL
                new_lines.append(f"DATABASE_URL={PG_URL}\n")
                found_pg_url = True
                updated = True
            else:
                # Comment out SQLite URL
                new_lines.append(f"# {line.strip()}\n")
                updated = True
        else:
            new_lines.append(line)
    
    # If no PostgreSQL URL found, add it
    if not found_pg_url:
        # Add PostgreSQL URL at the end
        new_lines.append(f"DATABASE_URL={PG_URL}\n")
        updated = True
    
    if updated:
        # Write back
        with open(ENV_FILE, 'w') as f:
            f.writelines(new_lines)
        print(f"✓ Updated {ENV_FILE} with PostgreSQL connection string")
        return True
    else:
        print("ℹ No changes needed")
        return True

if __name__ == "__main__":
    update_env_file()

