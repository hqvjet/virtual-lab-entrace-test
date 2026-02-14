#!/bin/bash

echo "🚀 Starting DocHub Backend..."
echo ""

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found!"
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    echo "✅ Virtual environment created and dependencies installed"
    echo ""
else
    source venv/bin/activate
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Copying .env.example to .env..."
    cp .env.example .env
    echo "✅ .env created from .env.example"
    echo "⚠️  Please update .env with your database credentials if needed"
    echo ""
fi

# Start the server
echo "🔥 Starting FastAPI server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
