# Production Deployment Guide

## Prerequisites

1. Docker and Docker Compose installed
2. Git installed
3. Properly configured `.env.production` file with production values

## Deployment Steps

### 1. Clone the Repository (if not already done)

```bash
git clone <repository-url>
cd my-newsletter-app
```

### 2. Configure Environment Variables

Create a `.env.production` file based on `.env.production.example` and update with your production values:

```bash
cp .env.production.example .env.production
# Edit .env.production with your production values
```

Important variables to configure:
- `POSTGRES_USER_PROD`
- `POSTGRES_PASSWORD_PROD`
- `POSTGRES_DB_PROD`
- `JWT_SECRET_PROD`
- `JWT_REFRESH_SECRET_PROD`
- `PGADMIN_PASSWORD_PROD`

### 3. Deploy Using Scripts

#### On Linux/macOS:
```bash
./deploy-prod.sh
```

#### On Windows:
```cmd
deploy-prod.bat
```

### 4. Manual Deployment (Alternative)

```bash
# Pull latest code
git pull origin main

# Build and deploy containers
docker-compose --env-file .env.production -f docker-compose-prod.yml up -d --build

# Check container status
docker-compose --env-file .env.production -f docker-compose-prod.yml ps
```

## Post-Deployment

### Check Logs
```bash
# View all logs
docker-compose --env-file .env.production -f docker-compose-prod.yml logs -f

# View specific service logs
docker-compose --env-file .env.production -f docker-compose-prod.yml logs -f backend
```

### Reset Passwords (if needed)
If you need to reset user passwords after deployment:

```bash
# Enter the backend container
docker exec -it pulse-backend node reset-passwords.js
```

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL variables in `.env.production` are correct
2. **Permission denied errors**: Make sure the deployment scripts have execute permissions
3. **Port conflicts**: Ensure ports 3002, 5432, and 80 are not being used by other services

### Useful Commands

```bash
# Stop all services
docker-compose --env-file .env.production -f docker-compose-prod.yml down

# Restart services
docker-compose --env-file .env.production -f docker-compose-prod.yml restart

# View running containers
docker ps

# Enter backend container for debugging
docker exec -it pulse-backend sh

# Enter database container for debugging
docker exec -it pulse-db sh
```

## Version Information

Current version: 1.2.1

You can verify the deployed version by checking the login modal in the frontend application.