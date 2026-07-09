param(
    [int]$RetentionDays = 60
)

$BackupDir = "C:\ELMostafa\backups"
$ContainerName = "backend-postgres-1"
$DbName = "elmostafa_db"
$DbUser = "postgres"
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupDir "$DbName-$Date.sql"

# Ensure backup directory exists
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Run pg_dump inside Docker container
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting backup..."
$result = docker exec $ContainerName pg_dump -U $DbUser $DbName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Backup failed: $result"
    exit 1
}

# Write to file
$result | Out-File -FilePath $BackupFile -Encoding ascii
Write-Host "[OK] Saved: $BackupFile"

# Remove backups older than retention period
$Cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "$DbName-*.sql" | Where-Object {
    $_.LastWriteTime -lt $Cutoff
} | ForEach-Object {
    Write-Host "[CLEANUP] Deleting old backup: $($_.Name)"
    Remove-Item $_.FullName -Force
}

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup complete. Retention: $RetentionDays days."
