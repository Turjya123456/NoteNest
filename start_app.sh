#!/bin/bash

# ====================================================
#   🪺  NoteNest - Mac/Linux Launcher
# ====================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "  🪺  NoteNest - Personal Notebook App"
echo "  ======================================"
echo ""

# Step 1: Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[!] Node.js is not installed.${NC}"
    echo ""
    echo "  Please install Node.js:"
    echo "  → Mac:   brew install node   OR  visit https://nodejs.org"
    echo "  → Linux: sudo apt install nodejs npm"
    echo ""
    exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}[OK]${NC} Node.js found: $NODE_VER"

# Step 2: Install dependencies (first time only)
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${CYAN}[*] First-time setup: Installing dependencies...${NC}"
    npm install --silent
    echo -e "${GREEN}[OK]${NC} Dependencies installed!"
else
    echo -e "${GREEN}[OK]${NC} Dependencies already installed."
fi

# Step 3: Create data folder
mkdir -p data
echo -e "${GREEN}[OK]${NC} Data folder ready."

# Step 4: Start the server
echo ""
echo -e "${CYAN}[*] Starting NoteNest server...${NC}"
node server.js &
SERVER_PID=$!
sleep 2

# Step 5: Open browser
echo -e "${CYAN}[*] Opening NoteNest in your browser...${NC}"
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

echo ""
echo "  ======================================================"
echo -e "  ${GREEN}✅  NoteNest is running!${NC}"
echo ""
echo "  📌 Open in browser : http://localhost:3000"
echo "  👤 Sign up         : Click 'Create Account'"
echo "  🔑 Admin login     : admin / admin123"
echo ""
echo "  Press Ctrl+C to stop the server."
echo "  ======================================================"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping NoteNest...'; kill $SERVER_PID; exit 0" SIGINT
wait $SERVER_PID
