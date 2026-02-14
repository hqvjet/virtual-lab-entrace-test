#!/bin/bash

# Vietnam University Network Visualization - Start Script
# Author: GitHub Copilot
# Date: February 11, 2026

echo "🎓 Starting Vietnam University Network Visualization..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed!${NC}"
    echo "Please install Python 3 to run this application."
    exit 1
fi

# Get Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo -e "${GREEN}✅ Python ${PYTHON_VERSION} found${NC}"

# Check if data file exists
if [ ! -f "data/vietnam_university_data_mock.json" ]; then
    echo -e "${RED}❌ Data file not found!${NC}"
    echo "Please ensure 'data/vietnam_university_data_mock.json' exists."
    exit 1
fi

echo -e "${GREEN}✅ Data file found (52 universities)${NC}"

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use!${NC}"
    echo "Attempting to kill the process..."
    kill -9 $(lsof -ti:8000) 2>/dev/null
    sleep 1
fi

# Start the server
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Starting HTTP Server on port 8000...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📊 Visualization URL:${NC}"
echo -e "   ${BLUE}http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}💡 Features:${NC}"
echo "   ✨ Interactive force-directed graph"
echo "   🔍 Search and filter universities"
echo "   📈 Real-time statistics dashboard"
echo "   🎨 Beautiful gradient UI with animations"
echo "   📥 Export to PNG"
echo ""
echo -e "${GREEN}⌨️  Controls:${NC}"
echo "   • Drag nodes to rearrange"
echo "   • Scroll to zoom in/out"
echo "   • Hover to see details"
echo "   • Click nodes for effects"
echo ""
echo -e "${RED}Press Ctrl+C to stop the server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Try to open in browser (cross-platform)
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8000 2>/dev/null &
elif command -v gnome-open &> /dev/null; then
    gnome-open http://localhost:8000 2>/dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:8000 2>/dev/null &
fi

# Start Python HTTP server
python3 -m http.server 8000
