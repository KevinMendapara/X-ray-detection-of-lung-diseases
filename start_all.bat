@echo off
echo ========================================================
echo   Launching TB Detect AI Full Stack System
echo ========================================================
start "TB Detect AI - Backend" cmd /k "run_backend.bat"
timeout /t 3 /nobreak >nul
start "TB Detect AI - Frontend" cmd /k "run_frontend.bat"
echo System launching... Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000
