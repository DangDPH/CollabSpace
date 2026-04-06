@echo off
setlocal
cd /d "%~dp0"

echo 🧼 Cleaning up containers...
docker-compose down >nul 2>&1

echo 🏗️ Building and Starting CollabSpace...
docker-compose up --build -d

echo 🚀 ---------------------------------------------------
echo    ╔════════════════════════════════════════════════╗
echo    ║      COLLABSPACE: ACCESS DASHBOARD             ║
echo    ╚════════════════════════════════════════════════╝
echo    1. LOCAL:  http://localhost
echo    2. GLOBAL: npx cloudflared tunnel --url http://localhost:80
echo    ---------------------------------------------------
echo    💡 TIP: Share the Global link with your team for
echo    full HTTPS support and microphone access!
echo 🚀 ---------------------------------------------------

pause
