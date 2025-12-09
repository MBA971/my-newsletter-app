# Database Restoration Instructions for Production

This document provides instructions on how to restore the Newsletter application database in a production environment.

## Prerequisites

1. PostgreSQL server installed and running
2. `psql` command-line tool available
3. Database user with appropriate privileges
4. `export-database-final.sql` file (included in this package)

## Files Included

1. `export-database-final.sql` - Database schema and data with hashed passwords (ready for production)
2. `restore-production-db.sql` - Alternative SQL restoration script
3. `restore-production-db.bat` - Windows batch script for restoration
4. `restore-production-db.sh` - Linux/Unix shell script for restoration
5. `RESTORE_DB_INSTRUCTIONS.md` - This instruction file

## ⚠️ Security Warning

**Never use plain text passwords in production!** All passwords in the database export are properly hashed using bcrypt.

After importing the database, you MUST immediately change all user passwords in the production environment. Do not use the default passwords in production!

## Method 1: Using the Pre-generated Export File (Recommended)

### For Windows:
1. Open Command Prompt as Administrator
2. Navigate to the directory containing the export file
3. Run the batch script:
   ```
   restore-production-db.bat
   ```
   Or run manually:
   ```
   psql -h YOUR_HOST -p 5432 -U YOUR_USER -d newsletter_app -f export-database-final.sql
   ```

### For Linux/Unix:
1. Open terminal
2. Navigate to the directory containing the export file
3. Make the script executable:
   ```
   chmod +x restore-production-db.sh
   ```
4. Run the script:
   ```
   ./restore-production-db.sh
   ```
   Or run manually:
   ```
   psql -h YOUR_HOST -p 5432 -U YOUR_USER -d newsletter_app -f export-database-final.sql
   ```

## Method 2: Using the SQL Script

1. Connect to your PostgreSQL server
2. Execute the `restore-production-db.sql` script:
   ```
   psql -h YOUR_HOST -p 5432 -U YOUR_USER -d newsletter_app -f restore-production-db.sql
   ```

## Production Environment Variables

When restoring to production, make sure to set the following environment variables or update the scripts:

```
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=newsletter_app
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_production_password
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

## Verifying the Restoration

After restoring the database, you can verify it worked correctly by:

1. Connecting to the database
2. Checking that all tables were created:
   - domains
   - users
   - news
   - subscribers
   - audit_log
3. Verifying sample data exists in each table
4. Confirming that user passwords are properly hashed (they should look like `$2b$12$...`)

## Post-Restoration Security Steps

1. **Immediately change all user passwords** using the admin interface
2. **Create additional admin accounts** if needed
3. **Remove or disable default test accounts** that are not needed
4. **Review and update domain assignments** as needed
5. **Configure proper database permissions** for the application user

## Troubleshooting

### Common Issues:

1. **Permission denied errors**: Make sure your PostgreSQL user has CREATE privileges
2. **Foreign key constraint errors**: Ensure tables are created in the correct order (the provided SQL handles this)
3. **Connection refused**: Verify PostgreSQL is running and accessible
4. **Authentication failed**: Double-check your database credentials
5. **File not found errors**: Ensure you're running the commands from the correct directory

### Need Help?

If you encounter any issues during the restoration process, please contact the development team for assistance.