#!/bin/bash

echo "Building and starting Newsletter App with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Parse command line arguments
MODE="dev"
while [[ $# -gt 0 ]]; do
  case $1 in
    -p|--prod)
      MODE="prod"
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Build and start containers
if [ "$MODE" = "prod" ]; then
    echo "Starting in production mode..."
    docker-compose -f docker-compose.prod.yml up --build
else
    echo "Starting in development mode..."
    docker-compose up --build
fi

echo "Newsletter App is now running!"
echo "Access it at:"
if [ "$MODE" = "prod" ]; then
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:3002"
else
    echo "  Frontend: http://localhost:5173"
    echo "  Backend API: http://localhost:3002"
fi