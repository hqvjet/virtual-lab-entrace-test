#!/bin/bash

echo "🚀 Starting DocHub (Backend + Frontend)..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "📦 Starting Backend..."
cd backend
chmod +x run.sh
./run.sh &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend
chmod +x run.sh
./run.sh &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both services started!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for both processes
wait
