@echo off
setlocal

echo Building and starting Newsletter App with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker and try again.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)

REM Parse command line arguments
set MODE=dev
if "%1"=="-p" set MODE=prod
if "%1"=="--prod" set MODE=prod

REM Build and start containers
if "%MODE%"=="prod" (
    echo Starting in production mode...
    docker-compose -f docker-compose.prod.yml up --build
) else (
    echo Starting in development mode...
    docker-compose up --build
)

echo Newsletter App is now running!
echo Access it at:
if "%MODE%"=="prod" (
    echo   Frontend: http://localhost
    echo   Backend API: http://localhost:3002
) else (
    echo   Frontend: http://localhost:5173
    echo   Backend API: http://localhost:3002
)