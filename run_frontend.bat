@echo off
set "PATH=C:\Users\Hp\AppData\Local\Programs\nodejs;%PATH%"
echo ========================================================
echo   Starting TB Detect AI - Frontend Server (React + Vite)
echo   Local Address: http://localhost:3000
echo ========================================================
cd frontend
call .\node_modules\.bin\vite.cmd --port 3000 --host
pause
