#!/bin/bash

# Deployment script for production environment

echo "Starting deployment process..."

# Check if we're in the correct directory
if [ ! -f "docker-compose-prod.yml" ]; then
    echo "Error: docker-compose-prod.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Pull the latest code
echo "Pulling latest code from repository..."
git pull origin main

# Build and deploy containers
echo "Building and deploying containers..."
docker-compose --env-file .env.production -f docker-compose-prod.yml up -d --build

# Check if containers are running
echo "Checking container status..."
docker-compose --env-file .env.production -f docker-compose-prod.yml ps

echo "Deployment completed!"
echo "Check the logs with: docker-compose --env-file .env.production -f docker-compose-prod.yml logs -f"