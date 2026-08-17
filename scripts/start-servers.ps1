$ErrorActionPreference = 'Stop'

$ROOT = 'C:\EL-Mostafa'
$BACKEND = Join-Path $ROOT 'backend'
$FRONTEND = Join-Path $ROOT 'frontend'
$BACKEND_PORT = 3001
$FRONTEND_PORT = 3000
$DB_CONTAINER = 'backend-postgres-1'
$REDIS_CONTAINER = 'erp-redis'
$BACKEND_PID = Join-Path $BACKEND 'server.pid'
$FRONTEND_PID = Join-Path $FRONTEND 'server.pid'

function Stop-Port($Port) {
  $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port }
  foreach ($c in $conns) {
    try {
      $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      if ($proc) {
        Write-Host "  stopping old PID $($proc.Id) on port $Port ($($proc.ProcessName))" -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force
      }
    } catch {
      Write-Host "  could not stop PID $($c.OwningProcess) on port $Port : $_" -ForegroundColor Yellow
    }
  }
}

function Ensure-Container($Name, $ComposeDir, $ComposeService) {
  $state = docker inspect $Name --format '{{.State.Running}}' 2>$null
  if ($state -eq 'true') {
    Write-Host "  $Name : already running" -ForegroundColor Green
    return $true
  }
  Write-Host "  $Name : starting..." -ForegroundColor Cyan
  $started = docker start $Name 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $started) {
    Write-Host "  $Name : not present, composing up..." -ForegroundColor Cyan
    Push-Location $ComposeDir
    docker compose up -d $ComposeService 2>&1
    $ok = $LASTEXITCODE -eq 0
    Pop-Location
    if (-not $ok) {
      Write-Host "  $Name : FAILED to start" -ForegroundColor Red
      return $false
    }
  }
  Write-Host "  $Name : started" -ForegroundColor Green
  return $true
}

function Build-Backend {
  Write-Host 'Building backend (npm run build)...' -ForegroundColor Cyan
  Push-Location $BACKEND
  npm run build 2>&1
  $ok = $LASTEXITCODE -eq 0
  Pop-Location
  if (-not $ok) { throw 'Backend build failed' }
}

function Build-Frontend {
  Write-Host 'Building frontend (npm run build)...' -ForegroundColor Cyan
  Push-Location $FRONTEND
  npm run build 2>&1
  $ok = $LASTEXITCODE -eq 0
  Pop-Location
  if (-not $ok) { throw 'Frontend build failed' }
}

function Start-Backend {
  Write-Host 'Starting backend (node dist/main) on port ' -NoNewline; Write-Host $BACKEND_PORT -ForegroundColor Cyan
  $env:NODE_ENV = 'production'
  $env:NODE_NO_WARNINGS = '1'
  $p = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList "/c cd /d $BACKEND && node dist/main > backend-out.log 2> backend-err.log" `
    -WindowStyle Hidden -PassThru
  Set-Content -Path $BACKEND_PID -Value $p.Id
}

function Start-Frontend {
  Write-Host 'Starting frontend (next start) on port ' -NoNewline; Write-Host $FRONTEND_PORT -ForegroundColor Cyan
  $p = Start-Process -FilePath 'cmd.exe' `
    -ArgumentList "/c cd /d $FRONTEND && npx next start -p $FRONTEND_PORT > frontend-out.log 2> frontend-err.log" `
    -WindowStyle Hidden -PassThru
  Set-Content -Path $FRONTEND_PID -Value $p.Id
}

function Wait-ForUrl {
  param([string]$Url, [int]$TimeoutMs = 60000)
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

function Wait-ForDb {
  param([int]$TimeoutMs = 30000)
  $elapsed = 0
  while ($elapsed -lt $TimeoutMs) {
    $ready = docker exec $DB_CONTAINER pg_isready -U postgres -d elmostafa_db 2>$null
    if ($LASTEXITCODE -eq 0 -and $ready -match 'accepting') { return $true }
    Start-Sleep -Milliseconds 1000
    $elapsed += 1000
  }
  return $false
}

Write-Host '==> Stopping old instances...' -ForegroundColor Cyan
Stop-Port $BACKEND_PORT
Stop-Port $FRONTEND_PORT

Write-Host '==> Ensuring infrastructure containers...' -ForegroundColor Cyan
$dbOk = Ensure-Container $DB_CONTAINER (Join-Path $BACKEND) 'postgres'
$redisOk = Ensure-Container $REDIS_CONTAINER $ROOT 'redis'
if (-not $dbOk -or -not $redisOk) {
  Write-Host "`nInfrastructure containers failed to start. Check docker compose output above." -ForegroundColor Red
  exit 1
}

Write-Host '==> Waiting for PostgreSQL...' -ForegroundColor Cyan
if (-not (Wait-ForDb)) {
  Write-Host '  PostgreSQL did not become ready in time' -ForegroundColor Red
  exit 1
}
Write-Host '  PostgreSQL : ready' -ForegroundColor Green

Write-Host '==> Building...' -ForegroundColor Cyan
try {
  Build-Backend
  Build-Frontend
} catch {
  Write-Host "`nBuild failed: $_" -ForegroundColor Red
  exit 1
}

Start-Backend
Start-Frontend

Write-Host '==> Waiting for services to become healthy...' -ForegroundColor Cyan
$be = Wait-ForUrl "http://127.0.0.1:$BACKEND_PORT/api/v1/health"
$fe = Wait-ForUrl "http://127.0.0.1:$FRONTEND_PORT/login/"

if ($be) { Write-Host "  backend  : OK ($BACKEND_PORT)" -ForegroundColor Green } else { Write-Host "  backend  : FAILED ($BACKEND_PORT)" -ForegroundColor Red }
if ($fe) { Write-Host "  frontend : OK ($FRONTEND_PORT)" -ForegroundColor Green } else { Write-Host "  frontend : FAILED ($FRONTEND_PORT)" -ForegroundColor Red }

if ($be -and $fe) {
  Write-Host "`nBoth services are up. Logs: backend-out.log / frontend-out.log" -ForegroundColor Green
  Write-Host "App: http://127.0.0.1:$FRONTEND_PORT/"
  exit 0
} else {
  Write-Host "`nOne or more services failed to start. Check backend-err.log / frontend-err.log" -ForegroundColor Yellow
  exit 1
}
