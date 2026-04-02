@echo off
setlocal
cd /d "%~dp0"

echo Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo Starting Docker Databases...
cd backend
docker-compose up -d
cd ..

echo Starting Real-time Server (Node)...
start "Realtime Server" cmd /k "cd realtime-server && npm run dev"

echo Starting Backend API (Python)...
start "Backend API" cmd /k ".venv\Scripts\activate && cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Starting Frontend (React)...
start "Frontend" cmd /k "cd frontend && npm run dev -- --host --port 5173"

echo ---
echo All components requested. 
echo Use [https://localhost:5173] to access the platform.
echo NOTE: Accept the self-signed certificate warning in your browser.
pause
