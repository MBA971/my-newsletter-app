@echo off
REM Newsletter App - Production Database Restoration Script (Windows Batch Version)
REM This script restores the database with properly hashed passwords for production use

echo === Newsletter App Production Database Restoration ===
echo.

REM Configuration - Modify these values for your production environment
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=newsletter_app
set DB_USER=postgres
set DB_PASSWORD=postgres

REM Check if required files exist
if not exist "export-database-final.sql" (
    echo ERROR: export-database-final.sql not found in current directory!
    echo Please ensure you have the production database export file.
    pause
    exit /b 1
)

echo Found export-database-final.sql - ready for production restore
echo.

REM Set environment variable for password to avoid prompt
set PGPASSWORD=%DB_PASSWORD%

echo Restoring database from export-database-final.sql...
echo This may take a few moments...

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f export-database-final.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo === Database restoration completed successfully ===
    echo.
    echo IMPORTANT SECURITY NOTICE:
    echo Default passwords have been set for all users.
    echo Please change all user passwords immediately in production!
    echo Use the admin account to manage other user accounts.
) else (
    echo.
    echo === Database restoration failed ===
    echo Check the error message above for details.
)

pause