#!/bin/bash

echo "🚀 Starting DocHub Frontend..."
echo ""

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found!"
    echo "📦 Installing frontend dependencies with pnpm..."
    if ! command -v pnpm &> /dev/null; then
        echo "⚠️  pnpm not found, installing via npm..."
        npm install -g pnpm
    fi
    pnpm install
    echo "✅ Frontend dependencies installed"
    echo ""
fi

# Start the development server
echo "🔥 Starting Next.js development server..."
pnpm run dev
