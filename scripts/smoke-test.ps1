$ErrorActionPreference = 'Continue'

$BE = 'http://127.0.0.1:3001/api/v1/health'
$FE = 'http://127.0.0.1:3000/login/'
$allOk = $true

function Check-Url($Name, $Url) {
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -lt 400) {
      Write-Host "  $Name : OK ($($r.StatusCode))" -ForegroundColor Green
      return $true
    }
    Write-Host "  $Name : HTTP $($r.StatusCode)" -ForegroundColor Red
    return $false
  } catch {
    Write-Host "  $Name : UNREACHABLE ($Url)" -ForegroundColor Red
    return $false
  }
}

Write-Host 'Smoke test — checking service health:'
$be = Check-Url 'backend ' $BE
$fe = Check-Url 'frontend' $FE
$allOk = $be -and $fe

if (-not $allOk) {
  Write-Host "`nSmoke test FAILED. Start services with scripts/start-servers.ps1" -ForegroundColor Red
  exit 1
}

Write-Host "`nSmoke test PASSED - both services healthy." -ForegroundColor Green
exit 0
