# Fix Slow Filesystem on Windows
# Move .next/dev to a faster local temp folder (C: drive)
# Run ONCE from an Admin PowerShell, then use `npm run dev:fixfs` forever

$projectDir = "D:\MostafaSaid\ELMostafa\frontend"
$targetDir = "$projectDir\.next"
$linkName = "dev"
$linkPath = "$targetDir\$linkName"
$tempDev = "$env:TEMP\next-dev-cache"

Write-Host "=== Next.js Slow Filesystem Fix ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Moves .next/dev to: $tempDev" -ForegroundColor Yellow
Write-Host ""

# Self-elevate if not admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Not running as Admin. Attempting self-elevation..." -ForegroundColor Yellow
    Start-Process PowerShell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit 0
}

# Stop any running dev servers
Write-Host "1. Stopping node processes using .next/dev..." -ForegroundColor Green
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Ensure .next directory exists
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Clean up existing .next/dev
if (Test-Path $linkPath) {
    $item = Get-Item $linkPath -Force
    if ($item.LinkType -eq 'Junction') {
        Write-Host "2. Removing existing junction..." -ForegroundColor Green
        Remove-Item $linkPath -Force
    } else {
        Write-Host "2. Moving existing .next/dev to .next/dev.bak..." -ForegroundColor Green
        Move-Item $linkPath "$targetDir\dev.bak" -Force -ErrorAction SilentlyContinue
    }
}

# Ensure temp directory exists
if (-not (Test-Path $tempDev)) {
    Write-Host "3. Creating temp directory..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $tempDev -Force | Out-Null
}

# Create the junction
Write-Host "4. Creating junction: $linkPath -> $tempDev" -ForegroundColor Green
New-Item -ItemType Junction -Path $linkPath -Target $tempDev -Force | Out-Null

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
Write-Host "The .next/dev cache is now on your C: drive (faster SSD)." -ForegroundColor Green
Write-Host "Reboot or restart your terminal, then run: npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "Recommended: Exclude repo folder from Windows Defender real-time scanning:" -ForegroundColor Yellow
Write-Host "  Windows Security -> Virus & threat protection -> Manage settings" -ForegroundColor Yellow
Write-Host "  -> Exclusions -> Add exclusion -> Folder -> D:\MostafaSaid\ELMostafa" -ForegroundColor Yellow
