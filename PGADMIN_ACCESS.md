# pgAdmin Access Guide

## Access Information

pgAdmin is now included in the local Docker setup and can be accessed at:
- **URL**: http://localhost:5050
- **Default Email**: admin@localhost.com
- **Default Password**: admin123

## Initial Setup

1. Navigate to http://localhost:5050 in your browser
2. Login with the credentials above
3. Click on "Add New Server" to configure the database connection

## Database Connection Settings

When adding a new server in pgAdmin, use these settings:

- **Name**: Newsletter App Database
- **Host**: db (or localhost if connecting from outside Docker)
- **Port**: 5432
- **Maintenance Database**: newsletter_app
- **Username**: postgres
- **Password**: postgres

## Notes

- The database connection details are configured for access from within the Docker network
- If you need to connect from outside Docker (e.g., using a desktop pgAdmin), use:
  - Host: localhost
  - Port: 5433 (as mapped in docker-compose.yml)