#!/bin/bash

echo "🚀 Starting DocHub Frontend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found!"
    echo "Please run: pnpm install"
    exit 1
fi

# Start the development server
echo "🔥 Starting Next.js development server..."
pnpm run dev
