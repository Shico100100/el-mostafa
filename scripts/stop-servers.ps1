$ErrorActionPreference = 'Continue'

function Stop-Port($Port) {
  $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $Port }
  foreach ($c in $conns) {
    try {
      $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
      if ($proc) {
        Write-Host "Stopping PID $($proc.Id) on port $Port ($($proc.ProcessName))"
        $proc | Stop-Process -Force
      }
    } catch {
      Write-Host "Could not stop PID $($c.OwningProcess) on port $Port : $_"
    }
  }
}

function Remove-PidFile($Path) {
  if (Test-Path -LiteralPath $Path) {
    Remove-Item -LiteralPath $Path -Force
    Write-Host "Removed pid file $Path"
  }
}

Stop-Port 3001
Stop-Port 3000
Remove-PidFile 'C:\EL-Mostafa\backend\server.pid'
Remove-PidFile 'C:\EL-Mostafa\frontend\server.pid'
Write-Host "Done."
