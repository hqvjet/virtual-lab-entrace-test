#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting COVID-19 Dashboard...${NC}\n"

# Check if backend virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo -e "${RED}❌ Backend virtual environment not found!${NC}"
    echo -e "${BLUE}Creating virtual environment...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Start Backend
echo -e "${GREEN}📡 Starting FastAPI Backend on port 8000...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo -e "${GREEN}🎨 Starting Next.js Frontend on port 3000...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Services started successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📡 Backend API:${NC} http://localhost:8000"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:8000/docs"
echo -e "${GREEN}🎨 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${RED}Press Ctrl+C to stop all services${NC}\n"

# Wait for Ctrl+C
trap "echo -e '\n${RED}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
