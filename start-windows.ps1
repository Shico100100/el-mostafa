# ELMostafa System - Windows Start Script
# Windows Start Script for ELMostafa System

Write-Host "Starting ELMostafa System..." -ForegroundColor Green

# Function to stop services on exit
function Stop-Services {
    Write-Host "`nStopping Services..." -ForegroundColor Yellow
    
    # Stop Backend
    if ($backendJob) {
        Stop-Job -Job $backendJob
        Remove-Job -Job $backendJob
    }
    
    # Stop Frontend
    if ($frontendJob) {
        Stop-Job -Job $frontendJob
        Remove-Job -Job $frontendJob
    }
    
    Write-Host "All services stopped." -ForegroundColor Green
}

# Register exit handler
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Stop-Services }

# Check for .env file
if (-Not (Test-Path "backend\.env")) {
    Write-Host ".env file not found in backend folder." -ForegroundColor Red
    Write-Host "Please run setup-windows.ps1 first or create the .env file manually." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nBuilding Backend..." -ForegroundColor Cyan
Set-Location -LiteralPath "$PWD\backend"
npm run build
if (-NOT $?) {
    Write-Host "Backend build failed." -ForegroundColor Red
    exit 1
}
Set-Location -LiteralPath "$PWD\.."

Write-Host "`nStarting Backend..." -ForegroundColor Cyan
Write-Host "Port: 3001" -ForegroundColor Gray

# Start Backend in background (production mode - no watch)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run start:prod" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "`nStarting Frontend..." -ForegroundColor Cyan
Write-Host "Port: 3000" -ForegroundColor Gray

# Start Frontend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

Write-Host "`nSystem is running now!" -ForegroundColor Green
Write-Host "`nAccess URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Yellow

Write-Host "`nTwo separate windows have been opened for Backend and Frontend." -ForegroundColor Cyan
Write-Host "To stop the system, close the windows." -ForegroundColor Cyan

Write-Host "`nWait for startup to complete (approx 30 seconds)..." -ForegroundColor Yellow
Write-Host "Then open browser at: http://localhost:3000" -ForegroundColor Green
