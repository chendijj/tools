@echo off
title File Share Tool

echo ========================================
echo    File Share Tool
echo ========================================
echo.

REM Check Python
py --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found
    echo Please install Python 3.6+
    pause
    exit /b 1
)

echo Python OK

REM Check dependencies
py -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    py -m pip install -r requirements.txt
    if errorlevel 1 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed
) else (
    echo Dependencies OK
)

REM Create directories
if not exist "static\uploads" mkdir static\uploads

echo.
echo Starting server...
echo Press Ctrl+C to stop
echo.

REM Start app
py app.py

echo.
echo Server stopped
pause
