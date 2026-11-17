$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location $scriptDir
$env:PATH = "C:\Users\Hp\AppData\Local\Programs\nodejs;" + $env:PATH
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting TB Detect AI - Frontend Server (React + Vite)" -ForegroundColor Green
Write-Host "  Local Address: http://localhost:3000" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location -Path "$scriptDir\frontend"
& ".\node_modules\.bin\vite.cmd" --port 3000 --host
