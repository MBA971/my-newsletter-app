#!/bin/bash

echo "Checking Newsletter App services..."

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed."
    exit 1
fi

# Check if services are running
if docker-compose ps | grep -q "newsletter_backend"; then
    echo "✓ Backend service is running"
else
    echo "✗ Backend service is not running"
fi

if docker-compose ps | grep -q "newsletter_frontend"; then
    echo "✓ Frontend development service is running"
else
    echo "✗ Frontend development service is not running"
fi

if docker-compose -f docker-compose.prod.yml ps | grep -q "newsletter_frontend"; then
    echo "✓ Production frontend service is running"
else
    echo "✗ Production frontend service is not running"
fi

if docker-compose ps | grep -q "newsletter_db"; then
    echo "✓ Database service is running"
elif docker-compose -f docker-compose.prod.yml ps | grep -q "newsletter_db"; then
    echo "✓ Database service is running"
else
    echo "✗ Database service is not running"
fi

echo "Health check complete."