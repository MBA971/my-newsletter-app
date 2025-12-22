# Security Policy for Newsletter Application

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.4.x   | ✅ Recommended     |
| < 1.4.0 | ❌ Not supported   |

## Reporting a Vulnerability

If you discover a security vulnerability, please contact the development team directly. Do not open a public issue.

## Security Measures

### Environment Variables
- All sensitive configuration is stored in environment variables
- `.env` files are excluded from version control
- Use appropriate environment variables for production deployments

### Database Security
- Database credentials are stored in environment variables
- SQL export files containing sensitive data are excluded from version control
- Use parameterized queries to prevent SQL injection

### Authentication
- JWT tokens for authentication
- Passwords are hashed using bcrypt with 12 rounds
- Secure token handling and refresh mechanisms

### Data Protection
- The following file types are excluded from version control:
  - Database export files (`.sql`)
  - Environment files (`.env`)
  - Password-related files
  - Configuration files with sensitive data

### Git Security
The following files and patterns are excluded from version control:
- `*.sql` files (database exports)
- `*.env*` files (environment configurations)
- `*.db` files (database files)
- Password and secret related files
- Only `export-database-final.sql` is allowed as it should be a sanitized version

## Password Management
- Passwords are never stored in plain text
- All passwords are hashed using bcrypt
- Password reset functionality follows security best practices

## API Security
- Rate limiting implemented to prevent abuse
- Authentication required for sensitive operations
- Input validation and sanitization for all API endpoints

## Deployment Security
- Use HTTPS in production environments
- Secure environment variables for production deployments
- Regular security updates for dependencies