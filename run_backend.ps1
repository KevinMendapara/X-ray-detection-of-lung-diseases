$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location $scriptDir
$env:PYTHONPATH = "$scriptDir;$scriptDir\backend;$env:PYTHONPATH"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting TB Detect AI - Backend Server (FastAPI)" -ForegroundColor Green
Write-Host "  DenseNet121 + SVM + Grad-CAM++ Inference Engine" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
python run.py
