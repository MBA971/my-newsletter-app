# Fixes Applied to Alenia Pulse

## 1. Database Connection Issue (ECONNREFUSED)

### Problem
The backend service was unable to connect to PostgreSQL with error:
```
Error: connect ECONNREFUSED 10.99.7.2:5432
```

### Root Cause
The `.env` file contained placeholder values instead of actual credentials:
```env
POSTGRES_PASSWORD_PROD=secure_password_here
JWT_SECRET_PROD=your_generated_jwt_secret_here
JWT_REFRESH_SECRET_PROD=your_generated_refresh_secret_here
PGADMIN_PASSWORD_PROD=secure_pgadmin_password_here
```

### Solution
Updated `.env` with actual values:
```env
POSTGRES_PASSWORD_PROD=pulse_password_123
JWT_SECRET_PROD=pulse_jwt_secret_key_here_change_me
JWT_REFRESH_SECRET_PROD=pulse_jwt_refresh_secret_here_change_me
PGADMIN_PASSWORD_PROD=pulse_pgadmin_password_123
```

Added warnings in `.env.production.example` and README.md about changing placeholder values for production use.

## 2. API Root Route 404 Error

### Problem
Accessing `https://pulse-api.academy.alenia.io/` returned a 404 Not Found error.

### Root Cause
The backend server (`server-secure.js`) did not have a route handler for the root path (`/`).

### Solution
Added a root route handler to `server-secure.js`:

```javascript
// Root route for health check and identification
app.get('/', (req, res) => {
    res.json({
        message: 'Alenia Pulse API Server',
        version: '1.2.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: '/api/health for health check'
    });
});
```

This provides a simple health check endpoint and identifies the server when accessed directly.

## 3. Documentation Improvements

### Added Troubleshooting Section
Enhanced README.md with a troubleshooting section that includes:
- Steps to diagnose database connection issues
- Commands to check service status
- Common fixes for connection problems

### Improved Environment Variable Documentation
- Clearer instructions for generating secure JWT secrets
- Warnings about using placeholder values in production
- Better organization of environment variables in the documentation

## 4. Deployment Scripts

Created deployment helper scripts:
- `deploy-prod.sh` for Linux/Mac environments
- `deploy-prod.bat` for Windows environments

These scripts include validation checks for required tools and environment variables.

## How to Apply These Fixes

1. Ensure your `.env` file has actual values (not placeholders)
2. Restart services:
   ```bash
   docker-compose -f docker-compose-prod.yml down
   docker-compose -f docker-compose-prod.yml up -d --build
   ```
3. Access the API root endpoint to verify the fix:
   ```
   https://pulse-api.academy.alenia.io/
   ```

The server should now respond with a JSON message identifying the Alenia Pulse API server.