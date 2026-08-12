param(
  [string]$BackupDir = "C:\EL-Mostafa\backups",
  [int]$Keep = 7
)

$ErrorActionPreference = 'Stop'

# Read DB connection from backend/.env at runtime (secrets never stored in this script)
$envPath = Join-Path $PSScriptRoot '..\backend\.env'
$values = @{}
if (Test-Path $envPath) {
  foreach ($line in (Get-Content $envPath)) {
    if ($line -match '^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$') {
      $values[$matches[1]] = $matches[2].Trim('"')
    }
  }
}

$dbHost = $values['DATABASE_HOST'] || '127.0.0.1'
$dbPort = $values['DATABASE_PORT'] || '5432'
$dbUser = $values['DATABASE_USERNAME'] || 'postgres'
$dbPass = $values['DATABASE_PASSWORD'] || 'postgres'
$dbName = $values['DATABASE_NAME'] || 'elmostafa_db'

if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

$timestamp = Get-Date -Format 'yyyy_MM_dd_HHmmss'
$outFile = Join-Path $BackupDir "backup_$timestamp.dump"

$env:PGPASSWORD = $dbPass
try {
  Write-Host "Dumping $dbName@$dbHost:$dbPort -> $outFile"
  & pg_dump -h $dbHost -p $dbPort -U $dbUser -F c -b -v -f $outFile $dbName
  if ($LASTEXITCODE -ne 0) { throw "pg_dump exited with code $LASTEXITCODE" }
  Write-Host "Backup OK: $((Get-Item $outFile).Length) bytes" -ForegroundColor Green
} finally {
  $env:PGPASSWORD = $null
}

# Prune old backups, keep most recent $Keep
$old = Get-ChildItem $BackupDir -Filter 'backup_*.dump' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip $Keep
foreach ($f in $old) {
  Write-Host "Removing old backup: $($f.Name)"
  Remove-Item $f.FullName -Force
}
