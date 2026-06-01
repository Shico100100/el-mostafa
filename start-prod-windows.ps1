# ELMostafa System - Windows Production Start Script
# Windows Production Start Script for ELMostafa System

Write-Host "Starting System (Production Mode)..." -ForegroundColor Green

# 1. Check PM2
Write-Host "`nChecking PM2..." -ForegroundColor Cyan
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    Write-Host "PM2 is installed." -ForegroundColor Green
}
else {
    Write-Host "PM2 is not installed. Installing..." -ForegroundColor Yellow
    npm install pm2 -g
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install PM2. Please install manually: npm install pm2 -g" -ForegroundColor Red
        exit 1
    }
}

# 2. Build Backend
Write-Host "`nBuilding Backend..." -ForegroundColor Cyan
Set-Location backend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Backend." -ForegroundColor Red
    exit 1
}
Set-Location ..

# 3. Build Frontend
Write-Host "`nBuilding Frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build Frontend." -ForegroundColor Red
    exit 1
}
Set-Location ..

# 4. Start Services via PM2
Write-Host "`nStarting Services with PM2..." -ForegroundColor Cyan
$env:NODE_ENV = "production"
pm2 start ecosystem.config.js
pm2 save
pm2 list

Write-Host "`nSystem is running in Production mode!" -ForegroundColor Green
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "`nTo monitor processes: pm2 monit" -ForegroundColor Gray
Write-Host "To stop system: pm2 stop all" -ForegroundColor Gray
