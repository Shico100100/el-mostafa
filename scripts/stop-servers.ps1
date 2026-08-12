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

Stop-Port 3001
Stop-Port 3000
Write-Host "Done."
