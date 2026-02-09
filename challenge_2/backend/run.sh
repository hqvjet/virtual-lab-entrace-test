#!/bin/bash

echo "🚀 Starting DocHub Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python -m venv venv"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Copying .env.example to .env..."
    cp .env.example .env
    echo "✅ Please update .env with your database credentials"
    echo ""
fi

# Start the server
echo "🔥 Starting FastAPI server..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
