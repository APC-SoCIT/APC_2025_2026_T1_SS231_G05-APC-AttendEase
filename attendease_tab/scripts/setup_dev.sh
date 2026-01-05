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
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "[ERROR] Python is not installed or not in PATH."
    echo "Please install Python 3.11 or higher."
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi
echo "[OK] Python found: $($PYTHON_CMD --version)"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    echo "Please install Node.js 18, 20, or 22 from https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js found: $(node --version)"
echo

# Create virtual environment
echo "Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "[INFO] Virtual environment already exists, skipping creation."
else
    $PYTHON_CMD -m venv venv
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
echo "(First run will download DeepFace models, which may take a few minutes...)"
pip install --upgrade pip
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
