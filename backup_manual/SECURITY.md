# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to michel.barnabot@alenia.io. All security vulnerabilities will be promptly addressed.

Please do not publicly disclose the vulnerability until it has been addressed by the team.

## Security Practices

### Authentication
- Passwords are hashed using bcrypt with a minimum of 10 rounds
- JWT tokens are used for stateless authentication
- Refresh tokens are used to extend user sessions securely
- Tokens are stored in HttpOnly cookies to prevent XSS attacks

### Authorization
- Role-based access control (RBAC) is implemented
- Users can only access resources within their permission level
- Contributors can only manage content in their assigned domain
- Admin users have full access to all resources

### Data Protection
- All sensitive data is encrypted at rest
- Communications are secured with HTTPS in production
- Database connections use prepared statements to prevent SQL injection
- Input validation and sanitization are performed on all user inputs

### Infrastructure
- Docker containers are used to isolate application components
- Regular security updates are applied to base images
- Network segmentation is implemented to limit lateral movement
- Access logs are maintained for audit purposes

### Rate Limiting
- Login attempts are limited to prevent brute force attacks
- API requests are rate-limited to prevent abuse
- Suspicious activity is logged and monitored

## Best Practices for Developers

1. Never commit sensitive information (passwords, API keys, etc.) to the repository
2. Validate and sanitize all user inputs
3. Use parameterized queries to prevent SQL injection
4. Implement proper error handling without exposing sensitive information
5. Keep dependencies up to date
6. Follow the principle of least privilege for all operations
7. Regularly review and update security configurations

## Incident Response

In the event of a security incident:
1. Contain the breach and prevent further damage
2. Assess the impact and scope of the incident
3. Notify affected parties as required by law
4. Document the incident and lessons learned
5. Implement measures to prevent similar incidents