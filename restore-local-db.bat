@echo off
REM Newsletter App - Local Database Restoration Script (Windows Batch Version)
REM This script restores the database for local development

echo === Newsletter App Local Database Restoration ===
echo.

REM Configuration - Modify these values for your local environment
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=newsletter_app
set DB_USER=postgres
set DB_PASSWORD=postgres

REM Check if required files exist
if not exist "export-database-local.sql" (
    echo ERROR: export-database-local.sql not found in current directory!
    echo Please ensure you have the local database export file.
    pause
    exit /b 1
)

echo Found export-database-local.sql - ready for local restoration
echo.

REM Set environment variable for password to avoid prompt
set PGPASSWORD=%DB_PASSWORD%

echo Restoring database from export-database-local.sql...
echo This may take a few moments...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f export-database-local.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo === Database restoration completed successfully ===
    echo.
    echo Default user accounts have been created with password "admin123"
    echo Use admin@company.com for administrator access
) else (
    echo.
    echo === Database restoration failed ===
    echo Check the error message above for details.
)

pause