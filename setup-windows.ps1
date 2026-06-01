# ELMostafa System - Windows Setup Script
# Windows Setup Script for ELMostafa System

Write-Host "Starting ELMostafa System Setup..." -ForegroundColor Green

# 1. Check Node.js
Write-Host "`nChecking Node.js..." -ForegroundColor Cyan
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "Node.js is NOT installed. Please install it from: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 2. Check PostgreSQL
Write-Host "`nChecking PostgreSQL..." -ForegroundColor Cyan
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "PostgreSQL is installed" -ForegroundColor Green
}
else {
    Write-Host "PostgreSQL is NOT installed. Please install it from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# 3. Create Database
Write-Host "`nSetting up Database..." -ForegroundColor Cyan
Write-Host "Please enter PostgreSQL password (User: postgres):" -ForegroundColor Yellow
$env:PGPASSWORD = Read-Host -AsSecureString

# Convert SecureString to Plain Text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
$env:PGPASSWORD = $PlainPassword

# Create Database
$dbExists = psql -U postgres -lqt | Select-String -Pattern "elmostafa_db"
if ($dbExists) {
    Write-Host "Database 'elmostafa_db' already exists." -ForegroundColor Green
}
else {
    psql -U postgres -c "CREATE DATABASE elmostafa_db;"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database 'elmostafa_db' created successfully." -ForegroundColor Green
    }
    else {
        Write-Host "Failed to create database." -ForegroundColor Red
        exit 1
    }
}

# Clear password from memory
$env:PGPASSWORD = $null

# 4. Install Backend Dependencies
Write-Host "`nInstalling Backend Dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend dependencies installed." -ForegroundColor Green
}
else {
    Write-Host "Failed to install backend dependencies." -ForegroundColor Red
    exit 1
}
Set-Location ..

# 5. Install Frontend Dependencies
Write-Host "`nInstalling Frontend Dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend dependencies installed." -ForegroundColor Green
}
else {
    Write-Host "Failed to install frontend dependencies." -ForegroundColor Red
    exit 1
}
Set-Location ..

# 6. Check .env file
Write-Host "`nChecking Environment Files..." -ForegroundColor Cyan
if (-Not (Test-Path "backend\.env")) {
    Write-Host ".env file not found in backend folder." -ForegroundColor Yellow
    Write-Host "Creating default .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=elmostafa_db

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# Server Configuration
PORT=3001
NODE_ENV=development
"@
    
    Set-Content -Path "backend\.env" -Value $envContent
    Write-Host ".env file created in backend folder." -ForegroundColor Green
    Write-Host "Please review the file and change the password if necessary." -ForegroundColor Yellow
}
else {
    Write-Host ".env file exists in backend folder." -ForegroundColor Green
}

Write-Host "`nSetup Completed Successfully!" -ForegroundColor Green
Write-Host "`nTo start the system, run:" -ForegroundColor Cyan
Write-Host "    .\start-windows.ps1" -ForegroundColor Yellow
