@echo off
setlocal

echo 🚀 Starting Alenia Pulse Production Deployment

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  No .env file found. Creating one from .env.production.example
    copy .env.production.example .env
    echo ✅ Created .env file. Please edit it with your production values before deploying.
    echo 📝 Edit the .env file with a text editor
    exit /b 1
)

REM Build and start containers
echo 🏗️  Building and starting containers...
docker-compose -f docker-compose-prod.yml up -d --build

echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo 🔍 Checking service status...
docker-compose -f docker-compose-prod.yml ps | findstr "pulse-db" >nul
if %errorlevel% equ 0 (
    echo ✅ Database service is running
) else (
    echo ❌ Database service is not running
)

docker-compose -f docker-compose-prod.yml ps | findstr "pulse-backend" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend service is running
) else (
    echo ❌ Backend service is not running
)

docker-compose -f docker-compose-prod.yml ps | findstr "pulse-frontend" >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend service is running
) else (
    echo ❌ Frontend service is not running
)

docker-compose -f docker-compose-prod.yml ps | findstr "pulse-pgadmin" >nul
if %errorlevel% equ 0 (
    echo ✅ PgAdmin service is running
) else (
    echo ❌ PgAdmin service is not running
)

echo 🎉 Deployment completed!
echo 🌐 Access your application at:
echo    Frontend: https://pulse.academy.alenia.io
echo    Backend API: https://pulse-api.academy.alenia.io
echo    PgAdmin: https://pgadmin.pulse.academy.alenia.io