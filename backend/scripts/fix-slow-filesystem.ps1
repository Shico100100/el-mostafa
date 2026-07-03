# Fix Slow Filesystem on Windows
# Run this script ONCE from an Admin PowerShell to create a symlink
# that moves .next/dev to a faster local temp folder

$projectDir = "D:\MostafaSaid\ELMostafa\frontend"
$targetDir = "$projectDir\.next"
$linkName = "dev"
$linkPath = "$targetDir\$linkName"
$tempDev = "$env:TEMP\next-dev-cache"

Write-Host "=== Next.js Slow Filesystem Fix ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script moves .next/dev to: $tempDev" -ForegroundColor Yellow
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Please run PowerShell as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    exit 1
}

# Stop any running dev servers
Write-Host "1. Stopping any running dev servers..." -ForegroundColor Green
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next dev" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Clean up existing .next/dev
if (Test-Path $linkPath) {
    $item = Get-Item $linkPath -Force
    if ($item.LinkType -eq 'Junction') {
        Write-Host "2. Removing existing junction..." -ForegroundColor Green
        Remove-Item $linkPath -Force
    } else {
        Write-Host "2. Backing up existing .next/dev to .next/dev.bak..." -ForegroundColor Green
        Move-Item $linkPath "$targetDir\dev.bak" -Force -ErrorAction SilentlyContinue
    }
}

# Ensure temp directory exists
if (-not (Test-Path $tempDev)) {
    Write-Host "3. Creating temp directory..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $tempDev -Force | Out-Null
}

# Create the junction
Write-Host "4. Creating junction: $linkPath → $tempDev" -ForegroundColor Green
New-Item -ItemType Junction -Path $linkPath -Target $tempDev -Force | Out-Null

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
Write-Host "The .next/dev cache is now on your C: drive (faster SSD)." -ForegroundColor Green
Write-Host ""
Write-Host "Also RECOMMENDED: Add exclusion in Windows Defender:" -ForegroundColor Yellow
Write-Host "  Settings → Privacy & Security → Windows Security → Virus & threat protection" -ForegroundColor Yellow
Write-Host "  → Manage settings → Exclusions → Add exclusion → Folder" -ForegroundColor Yellow
Write-Host "  Add: D:\MostafaSaid\ELMostafa" -ForegroundColor Yellow
