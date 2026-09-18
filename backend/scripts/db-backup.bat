@echo off
REM ============================================================
REM  Database Backup Script
REM  Creates a pg_dump of elmostafa_db
REM
REM  Usage: db-backup.bat
REM ============================================================

setlocal

set "DB_NAME=elmostafa_db"
set "DB_USER=postgres"
set "CONTAINER=backend-postgres-1"
set "BACKUP_DIR=C:\EL-Mostafa"
set "TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_FILE=%BACKUP_DIR%\backup_%TIMESTAMP%.dump"

echo Backing up "%DB_NAME%" to "%BACKUP_FILE%"...

docker exec -i %CONTAINER% pg_dump -U %DB_USER% -d %DB_NAME% -Fc --no-owner > "%BACKUP_FILE%"

if errorlevel 1 (
    echo ERROR: Backup failed
    exit /b 1
)

for %%F in ("%BACKUP_FILE%") do set "FSIZE=%%~zF"
echo Backup created: %BACKUP_FILE% (%FSIZE% bytes)

endlocal
