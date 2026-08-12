$ErrorActionPreference = 'Stop'

$ROOT = 'C:\EL-Mostafa'
$BACKEND = Join-Path $ROOT 'backend'
$FRONTEND = Join-Path $ROOT 'frontend'
$BACKEND_PORT = 3001
$FRONTEND_PORT = 3000

function Start-Backend {
  Write-Host 'Starting backend (node dist/main) on port ' -NoNewline; Write-Host $BACKEND_PORT -ForegroundColor Cyan
  $env:NODE_ENV = 'production'
  $env:NODE_NO_WARNINGS = '1'
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList "/c cd /d $BACKEND && node dist/main > backend-out.log 2> backend-err.log" `
    -WindowStyle Hidden
}

function Start-Frontend {
  Write-Host 'Starting frontend (next start) on port ' -NoNewline; Write-Host $FRONTEND_PORT -ForegroundColor Cyan
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList "/c cd /d $FRONTEND && npx next start -p $FRONTEND_PORT > frontend-out.log 2> frontend-err.log" `
    -WindowStyle Hidden
}

function Wait-ForUrl {
  param([string]$Url, [int]$TimeoutMs = 30000)
  $elapsed = 0
  while ($elapsed -lt $TimeoutMs) {
    try {
      $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
      if ($r.StatusCode -lt 400) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 1000
    $elapsed += 1000
  }
  return $false
}

Start-Backend
Start-Frontend

Write-Host 'Waiting for services to become healthy...'
$be = Wait-ForUrl "http://127.0.0.1:$BACKEND_PORT/api/v1/health"
$fe = Wait-ForUrl "http://127.0.0.1:$FRONTEND_PORT/login/"

if ($be) { Write-Host "  backend  : OK ($BACKEND_PORT)" -ForegroundColor Green } else { Write-Host "  backend  : FAILED ($BACKEND_PORT)" -ForegroundColor Red }
if ($fe) { Write-Host "  frontend : OK ($FRONTEND_PORT)" -ForegroundColor Green } else { Write-Host "  frontend : FAILED ($FRONTEND_PORT)" -ForegroundColor Red }

if ($be -and $fe) {
  Write-Host "`nBoth services are up. Logs: backend-out.log / frontend-out.log" -ForegroundColor Green
  Write-Host "App: http://127.0.0.1:$FRONTEND_PORT/"
} else {
  Write-Host "`nOne or more services failed to start. Check backend-err.log / frontend-err.log" -ForegroundColor Yellow
  exit 1
}
