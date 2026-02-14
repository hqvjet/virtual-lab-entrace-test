#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Population Forecasting Dashboard...${NC}\n"

# Trap Ctrl+C early so it works even during setup
cleanup() {
    echo -e "\n${RED}Stopping services...${NC}"
    kill $AI_SERVICE_PID $FRONTEND_PID 2>/dev/null
    deactivate 2>/dev/null
    exit
}
trap cleanup INT TERM

# Check if AI service virtual environment exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found!${NC}"
    echo -e "${BLUE}📦 Creating virtual environment...${NC}"
    python3 -m venv .venv
    source .venv/bin/activate
    echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
    pip install -r ai_service/requirements.txt
    echo -e "${GREEN}✅ Virtual environment created and dependencies installed${NC}\n"
else
    source .venv/bin/activate
fi

# Check if model checkpoint exists
if [ ! -d "ai_service/ai/checkpoints" ]; then
    echo -e "${YELLOW}⚠️  Warning: Model checkpoints not found at ai_service/ai/checkpoints${NC}"
    echo -e "${YELLOW}   The AI service may need to train the model first${NC}\n"
fi

# Start AI Service Backend
echo -e "${GREEN}🤖 Starting AI Service Backend on port 8000...${NC}"
python -m ai_service.server.main &
AI_SERVICE_PID=$!

# Wait for AI service to start
sleep 3

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found${NC}"
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}\n"
fi

# Start Frontend
echo -e "${GREEN}🎨 Starting Next.js Frontend on port 3000...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Services started successfully!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🤖 AI Service API:${NC} http://localhost:8000"
echo -e "${GREEN}📚 API Docs:${NC} http://localhost:8000/docs"
echo -e "${GREEN}🎨 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${RED}Press Ctrl+C to stop all services${NC}\n"

# Wait for background processes
wait
