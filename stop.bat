@echo off
echo ===================================================
echo STOPPING LA CHAN SO SYSTEM
echo ================================== =================

echo.
echo [1/3] Closing Terminal windows...
taskkill /FI "WINDOWTITLE eq Backend - La Chan So*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AI Service - La Chan So*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - La Chan So*" /T /F >nul 2>&1

echo.
echo [2/3] Releasing Ports (3000, 8000, 5173)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find "LISTENING" ^| find ":3000 "') DO taskkill /F /PID %%a >nul 2>&1
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find "LISTENING" ^| find ":8000 "') DO taskkill /F /PID %%a >nul 2>&1
FOR /F "tokens=5" %%a IN ('netstat -aon ^| find "LISTENING" ^| find ":5173 "') DO taskkill /F /PID %%a >nul 2>&1

echo ===================================================
echo SUCCESS! All servers stopped and ports released.
echo ===================================================
pause
