#!/bin/bash

# AttendEase Development Setup (Linux/Mac)
# 
# Usage:
#   chmod +x setup_dev.sh
#   ./setup_dev.sh

set -e

echo "============================================"
echo "  AttendEase Development Setup (Linux/Mac)"
echo "============================================"
echo

# Check for Python
if ! command -v python &> /dev/null; then
    echo "[ERROR] Python is not installed or not in PATH."
    echo "Please install Python 3.11 or 3.12."
    exit 1
fi
echo "[OK] Python found: $(python --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js 18, 20, or 22 from https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js found: $(node --version)"

# Check for cmake (required for building dlib on Linux)
if ! command -v cmake &> /dev/null; then
    echo
    echo "[ERROR] cmake is not installed."
    echo "cmake is required to compile dlib on Linux/Mac."
    echo
    echo "Please install cmake:"
    echo "  Ubuntu/Debian: sudo apt install cmake"
    echo "  Fedora:        sudo dnf install cmake"
    echo "  Arch:          sudo pacman -S cmake"
    echo "  macOS:         brew install cmake"
    echo
    exit 1
fi
echo "[OK] cmake found: $(cmake --version | head -n1)"
echo

# Create virtual environment
echo "Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "[INFO] Virtual environment already exists, skipping creation."
else
    python -m venv venv
    echo "[OK] Virtual environment created."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "[OK] Virtual environment activated."
echo

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install
echo "[OK] Node.js dependencies installed."
echo

# Install Python dependencies
echo "Installing Python dependencies..."
echo "(This may take a few minutes as dlib needs to compile...)"
pip install -r python/requirements.txt
echo "[OK] Python dependencies installed."
echo

echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo
echo "To start developing:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Run the app: npm run dev"
echo
echo "This will start all 3 services (Python, Backend, Frontend) concurrently."
echo
