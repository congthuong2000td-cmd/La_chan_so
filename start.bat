@echo off
echo ===================================================
echo 🔥 ĐANG KHỞI ĐỘNG HỆ THỐNG SAFEGUARD 🔥
echo ===================================================

echo [1/3] Khoi dong Backend (Port 3000)... 
start "Backend - SafeGuard" cmd /k "cd backend && node server.js"

echo [2/3] Khoi dong AI Service (Port 8000)...
start "AI Service - SafeGuard" cmd /k "cd ai-service && .\venv\Scripts\activate.bat && uvicorn main:app --reload"

echo [3/3] Khoi dong Frontend (Port 5173)...
start "Frontend - SafeGuard" cmd /k "cd frontend && npm run dev"

echo ===================================================
echo ✅ Khoi dong hoan tat!
echo Vui long cho vai giay de ung dung tai. 
echo Dang tu dong mo trang web: http://localhost:5173
echo ===================================================
timeout /t 3 /nobreak > NUL
start http://localhost:5173
pause
