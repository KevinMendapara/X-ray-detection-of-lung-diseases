@echo off
setlocal
cd /d "%~dp0"
set PYTHONPATH=%CD%;%CD%\backend;%PYTHONPATH%
echo ========================================================
echo   Starting TB Detect AI - Backend Server (FastAPI)
echo   DenseNet121 + SVM + Grad-CAM++ Inference Engine
echo ========================================================
python run.py
pause
