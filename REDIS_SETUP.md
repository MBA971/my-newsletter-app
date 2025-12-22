# Redis Integration for Newsletter Application

## Overview
This document explains how Redis has been integrated into the newsletter application for caching purposes.

## Configuration

### Backend Configuration
The application uses Redis for caching through the following configuration in `backend/config/config.js`:
- **URL**: `process.env.REDIS_URL` (defaults to `redis://localhost:6379`)
- **Prefix**: `process.env.REDIS_PREFIX` (defaults to `newsletter:`)
- **TTL**: `process.env.REDIS_TTL` (defaults to `3600` seconds)

### Docker Services

#### Development Environment
In `docker-compose.yml`, Redis is configured as:
- Service name: `redis`
- Image: `redis:7-alpine`
- Container name: `newsletter_redis`
- Port mapping: `6379:6379`
- Environment variable: `REDIS_URL=redis://newsletter_redis:6379`

#### Production Environment
In `docker-compose-prod.yml`, Redis is configured as:
- Service name: `redis`
- Image: `redis:7-alpine`
- Container name: `pulse-redis`
- Environment variable: `REDIS_URL=${REDIS_URL_PROD}`
- Traefik labels for routing and SSL

## Usage

### Cache Operations
The application uses Redis for caching through the utility functions in `backend/utils/cache.js`:
- `cache.get(key)` - Retrieve a value from cache
- `cache.set(key, value, expiration)` - Store a value in cache
- `cache.del(key)` - Delete a value from cache
- `cache.exists(key)` - Check if a key exists
- `cache.flushAll()` - Clear all cache

### Cached Data
The following data is currently cached:
- News articles
- Domain information
- User information
- API responses

## Environment Variables

### Development
- `REDIS_URL`: URL for the Redis instance (default: `redis://newsletter_redis:6379`)

### Production
- `REDIS_URL_PROD`: URL for the production Redis instance (required)

## Deployment

### Development
To start the application with Redis:
```bash
docker-compose up -d
```

### Production
For production deployment, ensure the `REDIS_URL_PROD` environment variable is set in your environment before starting the services:
```bash
REDIS_URL_PROD=redis://your-redis-instance:6379 docker-compose -f docker-compose-prod.yml up -d
```

## Monitoring
- The application logs Redis connection status to the console
- Monitor logs with `docker logs newsletter_redis` or `docker logs pulse-redis`
- Check connection status with `redis-cli -h localhost -p 6379 ping`

## Troubleshooting

### Connection Issues
- Ensure the Redis container is running: `docker ps | grep redis`
- Check that the environment variables are properly set
- Verify network connectivity between containers

### Cache Performance
- Monitor Redis memory usage: `docker exec -it newsletter_redis redis-cli info memory`
- Adjust TTL values based on your caching requirements
- Consider Redis cluster setup for high-traffic scenarios