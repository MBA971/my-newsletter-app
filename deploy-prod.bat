@echo off
setlocal

echo Starting deployment process...

REM Check if we're in the correct directory
if not exist "docker-compose-prod.yml" (
    echo Error: docker-compose-prod.yml not found!
    echo Please run this script from the project root directory.
    exit /b 1
)

REM Pull the latest code
echo Pulling latest code from repository...
git pull origin main

REM Build and deploy containers
echo Building and deploying containers...
docker-compose --env-file .env.production -f docker-compose-prod.yml up -d --build

REM Check if containers are running
echo Checking container status...
docker-compose --env-file .env.production -f docker-compose-prod.yml ps

echo Deployment completed!
echo Check the logs with: docker-compose --env-file .env.production -f docker-compose-prod.yml logs -f