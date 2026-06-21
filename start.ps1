[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Assert-CommandExists {
    param([Parameter(Mandatory)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "La commande '$Name' est introuvable. Installez-la puis relancez ce script."
    }
}

Assert-CommandExists "dotnet"
Assert-CommandExists "npm"

$root = $PSScriptRoot
$backendDirectory = Join-Path $root "backend\BugBox.Api"
$frontendDirectory = Join-Path $root "frontend"
$powerShell = (Get-Process -Id $PID).Path

if (-not (Test-Path (Join-Path $backendDirectory "BugBox.Api.csproj"))) {
    throw "Le projet backend est introuvable dans '$backendDirectory'."
}

if (-not (Test-Path (Join-Path $frontendDirectory "package.json"))) {
    throw "Le projet frontend est introuvable dans '$frontendDirectory'."
}

$backendCommand = @'
$Host.UI.RawUI.WindowTitle = "BugBox - Backend"
dotnet run --urls http://localhost:5080
'@

$frontendCommand = @'
$Host.UI.RawUI.WindowTitle = "BugBox - Frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installation des dépendances frontend..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
npm run dev
'@

Write-Host "Démarrage de BugBox..." -ForegroundColor Cyan

Start-Process -FilePath $powerShell `
    -WorkingDirectory $backendDirectory `
    -ArgumentList @("-NoExit", "-Command", $backendCommand)

Start-Process -FilePath $powerShell `
    -WorkingDirectory $frontendDirectory `
    -ArgumentList @("-NoExit", "-Command", $frontendCommand)

Write-Host "Backend : http://localhost:5080" -ForegroundColor Green
Write-Host "Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "Fermez les deux nouvelles fenêtres pour arrêter les serveurs."
