@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   AttendEase Development Setup (Windows)
echo ============================================
echo.

:: Check for Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.11 or 3.12 from https://www.python.org/downloads/
    exit /b 1
)

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18, 20, or 22 from https://nodejs.org/
    exit /b 1
)

echo [OK] Python found
echo [OK] Node.js found
echo.

:: Get Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo Detected Python version: %PYTHON_VERSION%

:: Create virtual environment
echo.
echo Creating Python virtual environment...
if exist venv (
    echo [INFO] Virtual environment already exists, skipping creation.
) else (
    python -m venv venv
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to create virtual environment.
        exit /b 1
    )
    echo [OK] Virtual environment created.
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to activate virtual environment.
    exit /b 1
)
echo [OK] Virtual environment activated.
echo.

:: Install Node.js dependencies
echo Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm install failed.
    exit /b 1
)
echo [OK] Node.js dependencies installed.
echo.

:: Install pre-compiled dlib wheel based on Python version
echo Installing pre-compiled dlib wheel for Windows...

:: Check for Python 3.11
echo %PYTHON_VERSION% | findstr /C:"3.11" >nul
if %ERRORLEVEL% equ 0 (
    echo Detected Python 3.11, installing dlib-19.24.99 wheel...
    pip install https://github.com/z-mahmud22/Dlib_Windows_Python3.x/raw/main/dlib-19.24.99-cp311-cp311-win_amd64.whl
    goto :install_requirements
)

:: Check for Python 3.12
echo %PYTHON_VERSION% | findstr /C:"3.12" >nul
if %ERRORLEVEL% equ 0 (
    echo Detected Python 3.12, installing dlib-19.24.99 wheel...
    pip install https://github.com/z-mahmud22/Dlib_Windows_Python3.x/raw/main/dlib-19.24.99-cp312-cp312-win_amd64.whl
    goto :install_requirements
)

:: Fallback for other Python versions
echo [WARNING] No pre-compiled dlib wheel available for Python %PYTHON_VERSION%.
echo dlib will be installed from PyPI (may require Visual Studio Build Tools).
echo.

:install_requirements
:: Install Python dependencies
echo.
echo Installing Python dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERROR] pip install failed.
    exit /b 1
)
echo [OK] Python dependencies installed.
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start developing:
echo   1. Activate the virtual environment: venv\Scripts\activate
echo   2. Run the app: npm run dev
echo.
echo This will start all 3 services (Python, Backend, Frontend) concurrently.
echo.

endlocal

