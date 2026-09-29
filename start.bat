@echo off
title SENTINEL-X SOC Dashboard Launcher
echo ===============================================================
echo      SENTINEL-X // ENTERPRISE SOC PLATFORM LAUNCHER
echo ===============================================================
echo.

echo Starting Python Backend (FastAPI + WebSockets)...
start "SENTINEL-X Backend" cmd /k "cd /d "%~dp0backend" && .venv\Scripts\python -m uvicorn main:app --port 8000 --reload"

echo Starting React Frontend (Vite)...
start "SENTINEL-X Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are spinning up!
echo Frontend will be accessible at: http://localhost:5173
echo Backend API documentation at:  http://localhost:8000/docs
echo.
pause
