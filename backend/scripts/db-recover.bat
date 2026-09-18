@echo off
REM ============================================================
REM  Database Recovery Script
REM  Restores elmostafa_db from a pg_dump backup
REM
REM  Usage:
REM    db-recover.bat                          (uses latest backup)
REM    db-recover.bat path\to\backup.dump      (uses specific file)
REM ============================================================

setlocal enabledelayedexpansion

set "DB_NAME=elmostafa_db"
set "DB_USER=postgres"
set "CONTAINER=backend-postgres-1"
set "BACKUP_DIR=C:\EL-Mostafa"

if "%~1"=="" (
    echo Finding latest backup in %BACKUP_DIR%\...
    set "LATEST="
    for /f "delims=" %%F in ('dir /b /o-d "%BACKUP_DIR%\backup_*.dump" 2^>nul') do (
        if not defined LATEST set "LATEST=%%F"
    )
    if not defined LATEST (
        echo ERROR: No backup files found in %BACKUP_DIR%
        exit /b 1
    )
    set "BACKUP_FILE=%BACKUP_DIR%\!LATEST!"
    echo Found: !LATEST!
) else (
    set "BACKUP_FILE=%~1"
)

if not exist "%BACKUP_FILE%" (
    echo ERROR: File not found: %BACKUP_FILE%
    exit /b 1
)

echo.
echo ============================================================
echo  Recovering database "%DB_NAME%" from:
echo  %BACKUP_FILE%
echo ============================================================
echo.

echo [1/4] Checking if postgres container is running...
docker exec %CONTAINER% pg_isready -U %DB_USER% >nul 2>&1
if errorlevel 1 (
    echo ERROR: Container "%CONTAINER%" is not running or postgres is not ready.
    exit /b 1
)
echo OK

echo [2/4] Dropping and recreating database...
docker exec %CONTAINER% psql -U %DB_USER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%DB_NAME%' AND pid <> pg_backend_pid();" >nul 2>&1
docker exec %CONTAINER% psql -U %DB_USER% -d postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" >nul 2>&1
docker exec %CONTAINER% psql -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Failed to recreate database
    exit /b 1
)
echo OK

echo [3/4] Restoring from backup (this may take a while)...
docker exec -i %CONTAINER% pg_restore -U %DB_USER% -d %DB_NAME% --no-owner --no-privileges < "%BACKUP_FILE%"
if errorlevel 1 (
    echo WARNING: pg_restore reported some errors (this is often OK for idempotent restores)
)

echo [4/4] Verifying tables...
docker exec %CONTAINER% psql -U %DB_USER% -d %DB_NAME% -c "SELECT count(*) AS table_count FROM information_schema.tables WHERE table_schema='public';"
echo.

echo ============================================================
echo  Recovery complete! Restart the backend to apply migrations.
echo ============================================================

endlocal
