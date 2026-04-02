@echo off
setlocal
cd /d "%~dp0"

echo 🚢 Starting Docker Databases...
cd backend
docker-compose up -d
cd ..

echo 🚀 Starting Real-time Server (Node)...
start "Realtime Server" cmd /k "cd realtime-server && npm run dev"

echo 🧪 Starting Backend API (Python)...
start "Backend API" cmd /k ".venv\Scripts\activate && cd backend && uvicorn app.main:app --reload --port 8000"

echo 🌐 Starting Frontend (React)...
start "Frontend" cmd /k "cd frontend && npm run dev -- --host --port 5173"

echo ---
echo ✅ All components requested. 
echo Use [http://localhost:5173] to access the platform.
pause
