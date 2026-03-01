#!/bin/bash

# Installation script for Seasonality & Trend Explorer
# This script sets up both backend and frontend dependencies

set -e  # Exit on error

echo "=========================================="
echo "Seasonality & Trend Explorer - Installation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Python
echo -e "${YELLOW}[1/5] Checking Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Found: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check Node.js
echo -e "${YELLOW}[2/5] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 16+${NC}"
    exit 1
fi

# Setup Backend
echo -e "${YELLOW}[3/5] Setting up backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Setup Frontend
echo -e "${YELLOW}[4/5] Setting up frontend...${NC}"
cd frontend

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
else
    echo "Node modules already installed, skipping..."
fi

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# Create Database
echo -e "${YELLOW}[5/5] Creating database...${NC}"
cd backend
source .venv/bin/activate
python3 seed_db.py
cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Installation completed successfully!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start backend:"
echo "   cd backend"
echo "   source .venv/bin/activate"
echo "   uvicorn app:app --reload --port 8000"
echo ""
echo "2. Start frontend (in another terminal):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
