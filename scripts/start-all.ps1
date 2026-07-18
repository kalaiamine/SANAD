# ============================================================
# SANAD - Demarrage des deux services (Windows PowerShell)
# Usage :  .\scripts\start-all.ps1
#   - Service OCR/eKYC FastAPI  -> http://localhost:8001
#   - Application Next.js       -> http://localhost:3000
# ============================================================
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$svc = Join-Path $root "ai-services\ocr-service"
$venvPy = Join-Path $svc "venv\Scripts\python.exe"

if (-not (Test-Path $venvPy)) {
    Write-Host "venv Python introuvable - lancez d'abord .\scripts\setup.ps1" -ForegroundColor Red
    exit 1
}

# Service OCR (fenetre dediee)
Write-Host "Demarrage du service OCR/eKYC sur :8001 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$svc'; & '$venvPy' -m uvicorn main:app --port 8001"

# Frontend Next.js (fenetre dediee)
Write-Host "Demarrage de Next.js sur :3000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root'; npm run dev"

Write-Host ""
Write-Host "Services lances dans deux fenetres separees :" -ForegroundColor Green
Write-Host "  - OCR/eKYC : http://localhost:8001/docs"
Write-Host "  - Web      : http://localhost:3000"
