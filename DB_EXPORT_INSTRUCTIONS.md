# Database Export Instructions for Production Deployment

This document provides instructions on how to export the database and import it into a production environment using pgAdmin.

## Files Included

1. `export-database.sql` - Database schema and data with plain text passwords (for development/testing only)
2. `export-database-final.sql` - Database schema and data with hashed passwords (ready for production)
3. `DB_EXPORT_INSTRUCTIONS.md` - This instruction file

## ⚠️ Security Warning

**Never use plain text passwords in production!** The `export-database.sql` file contains plain text passwords and should only be used for development/testing purposes.

For production deployment, always use the `export-database-final.sql` file which contains properly hashed passwords.

## Method 1: Using the Pre-generated Hashed Export (Recommended)

The `export-database-final.sql` file is already generated and ready to use in production. All passwords are properly hashed using bcrypt.

### Steps:

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Create a new database named `newsletter_app`:
   ```sql
   CREATE DATABASE newsletter_app WITH ENCODING='UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
   ```
4. Right-click on the `newsletter_app` database and select "Query Tool"
5. Open the `export-database-final.sql` file
6. Execute the query by clicking the "Execute" button or pressing F5

## Method 2: Manual Export Using pg_dump (Alternative)

If you prefer to use PostgreSQL's native tools:

1. Export the database using pg_dump:
   ```bash
   pg_dump -h localhost -p 5432 -U postgres -W --clean --if-exists --no-owner --no-privileges newsletter_app > newsletter_app_backup.sql
   ```

2. You'll be prompted for the password (default is `postgres`)

3. Import into production:
   ```bash
   psql -h YOUR_PROD_HOST -p 5432 -U YOUR_PROD_USER -d newsletter_app -f newsletter_app_backup.sql
   ```

## Production Environment Variables

When deploying to production, make sure to set the following environment variables:

```
DB_USER=your_production_db_user
DB_HOST=your_production_db_host
DB_NAME=newsletter_app
DB_PASSWORD=your_secure_production_password
DB_PORT=5432
JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_secure_jwt_refresh_secret
BCRYPT_ROUNDS=12
```

## Default User Accounts

The database export includes the following default user accounts, all with the password `admin123` (hashed):

| Username | Email | Role | Domain | Password |
|----------|-------|------|--------|----------|
| admin | admin@company.com | admin | None | admin123 |
| hiring_manager | hiring@company.com | contributor | Hiring | admin123 |
| event_coordinator | events@company.com | contributor | Event | admin123 |
| journey_specialist | journey@company.com | contributor | Journey | admin123 |
| communication_manager | comm@company.com | contributor | Communication | admin123 |
| admin_contributor | admin.contributor@company.com | contributor | Admin | admin123 |
| john_doe | john.doe@company.com | user | None | admin123 |
| jane_smith | jane.smith@company.com | user | None | admin123 |

⚠️ **Important Security Notice**: 
After importing the database, you MUST immediately change all user passwords in the production environment. Do not use the default passwords in production!

## Verifying the Import

After importing the database, you can verify it worked correctly by:

1. Connecting to the database in pgAdmin
2. Checking that all tables were created:
   - domains
   - users
   - news
   - subscribers
   - audit_log
3. Verifying sample data exists in each table
4. Confirming that user passwords are properly hashed (they should look like `$2b$12$...`)

## Troubleshooting

### Common Issues:

1. **Permission denied errors**: Make sure your PostgreSQL user has CREATE privileges
2. **Foreign key constraint errors**: Ensure tables are created in the correct order (the provided SQL handles this)
3. **Connection refused**: Verify PostgreSQL is running and accessible
4. **Authentication failed**: Double-check your database credentials

### Need Help?

If you encounter any issues during the export/import process, please contact the development team for assistance.