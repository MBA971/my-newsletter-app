# Backend Structure

## Directory Organization

```
backend/
├── controllers/        # Business logic handlers
├── routes/             # URL routing definitions
├── middleware/         # Authentication and validation middleware
├── utils/              # Shared utilities and helpers
├── models/             # Data models (future use)
└── server.js           # Main application entry point
```

## Architecture

### Routes
Handle URL mappings and delegate to appropriate controllers.
- `auth.routes.js`: Authentication endpoints (/api/auth)
- `domains.routes.js`: Domain management endpoints (/api/domains)
- `news.routes.js`: News/article management endpoints (/api/news)
- `users.routes.js`: User management endpoints (/api/users)
- `subscribers.routes.js`: Subscriber management endpoints (/api/subscribers)
- `audit.routes.js`: Audit log endpoints (/api/audit)

### Controllers
Contain the business logic for each feature:
- `auth.controller.js`: Login, logout, token refresh
- `domains.controller.js`: Domain CRUD operations
- `news.controller.js`: News/article CRUD operations and search
- `users.controller.js`: User CRUD operations
- `subscribers.controller.js`: Subscriber CRUD operations
- `audit.controller.js`: Audit log retrieval

### Middleware
Handle cross-cutting concerns:
- `auth.js`: Authentication, authorization, token management

### Utils
Shared utilities:
- `database.js`: Database connection pool

## API Endpoints

All endpoints are prefixed with `/api`:

- **Auth**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`
- **Domains**: `/api/domains` (GET, POST, PUT, DELETE)
- **News**: `/api/news` (GET, POST, PUT, DELETE, SEARCH)
- **Users**: `/api/users` (GET, POST, PUT, DELETE)
- **Subscribers**: `/api/subscribers` (GET, POST, DELETE)
- **Audit**: `/api/audit` (GET)

## Database Schema

The application uses PostgreSQL with the following tables:
- `domains`: Article categories
- `users`: Application users with roles
- `news`: News articles
- `subscribers`: Newsletter subscribers
- `audit_log`: User login/logout tracking