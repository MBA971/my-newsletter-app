#!/bin/bash

echo "🚀 Starting Alenia Pulse Production Deployment"

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating one from .env.production.example"
    cp .env.production.example .env
    echo "✅ Created .env file. Please edit it with your production values before deploying."
    echo "📝 Run 'nano .env' to edit the file"
    exit 1
fi

# Check if required variables are set
if [ -z "$POSTGRES_PASSWORD_PROD" ] || [ -z "$JWT_SECRET_PROD" ]; then
    echo "⚠️  Required environment variables are not set."
    echo "📝 Please check your .env file and ensure all required variables are set."
    exit 1
fi

# Build and start containers
echo "🏗️  Building and starting containers..."
docker-compose -f docker-compose-prod.yml up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose -f docker-compose-prod.yml ps | grep -q "pulse-db"; then
    echo "✅ Database service is running"
else
    echo "❌ Database service is not running"
fi

if docker-compose -f docker-compose-prod.yml ps | grep -q "pulse-backend"; then
    echo "✅ Backend service is running"
else
    echo "❌ Backend service is not running"
fi

if docker-compose -f docker-compose-prod.yml ps | grep -q "pulse-frontend"; then
    echo "✅ Frontend service is running"
else
    echo "❌ Frontend service is not running"
fi

if docker-compose -f docker-compose-prod.yml ps | grep -q "pulse-pgadmin"; then
    echo "✅ PgAdmin service is running"
else
    echo "❌ PgAdmin service is not running"
fi

echo "🎉 Deployment completed!"
echo "🌐 Access your application at:"
echo "   Frontend: https://pulse.academy.alenia.io"
echo "   Backend API: https://pulse-api.academy.alenia.io"
echo "   PgAdmin: https://pgadmin.pulse.academy.alenia.io"