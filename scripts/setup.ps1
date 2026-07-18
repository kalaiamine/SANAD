# ============================================================
# SANAD - Installation automatisee (Windows PowerShell)
# Usage :  .\scripts\setup.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "== SANAD setup ==" -ForegroundColor Cyan

# 1) Fichier .env
if (-not (Test-Path "$root\.env")) {
    Copy-Item "$root\.env.example" "$root\.env"
    Write-Host "[1/4] .env cree depuis .env.example -> renseignez vos cles (GROQ_API_KEY, ROBOFLOW_API_KEY, JWT_SECRET...)" -ForegroundColor Yellow
} else {
    Write-Host "[1/4] .env existe deja - inchange" -ForegroundColor Green
}

# 2) Dependances Node
Write-Host "[2/4] Installation des dependances Node (npm install)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install a echoue" }

# 3) Environnement virtuel Python + dependances
$svc = Join-Path $root "ai-services\ocr-service"
$venvPy = Join-Path $svc "venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    Write-Host "[3/4] Creation du venv Python..." -ForegroundColor Cyan
    py -3.10 -m venv (Join-Path $svc "venv")
    if ($LASTEXITCODE -ne 0) { py -m venv (Join-Path $svc "venv") }
}
Write-Host "[3/4] Installation des dependances Python (pip install -r requirements.txt)..." -ForegroundColor Cyan
& $venvPy -m pip install --upgrade pip
& $venvPy -m pip install -r (Join-Path $svc "requirements.txt")
if ($LASTEXITCODE -ne 0) { throw "pip install a echoue" }

# 4) Verification MongoDB
Write-Host "[4/4] Verification MongoDB (127.0.0.1:27017)..." -ForegroundColor Cyan
$mongo = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($mongo) {
    Write-Host "MongoDB detecte." -ForegroundColor Green
} else {
    Write-Host "MongoDB n'est pas demarre. Installez/demarrez MongoDB Community ou utilisez : docker compose up mongo" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup termine. Lancement : .\scripts\start-all.ps1" -ForegroundColor Green
Write-Host "Puis (une seule fois) : npm run seed:insurer  et  npm run seed:demo" -ForegroundColor Green
