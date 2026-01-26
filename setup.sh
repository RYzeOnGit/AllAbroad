#!/bin/bash
# Setup script for AllAbroad backend

echo "🚀 Setting up AllAbroad backend..."

# Install python3-venv if needed
if ! python3 -m venv --help &> /dev/null; then
    echo "📦 Installing python3-venv..."
    sudo apt update
    sudo apt install -y python3.12-venv
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a .env file with your DATABASE_URL (see .env.example)"
echo "2. Activate the virtual environment: source venv/bin/activate"
echo "3. Run the server: uvicorn app.main:app --reload"
echo "4. Visit http://localhost:8000/docs to see all endpoints"

