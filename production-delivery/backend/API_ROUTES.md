# API Routes Documentation

## Base URL
All routes are prefixed with `/api`

## Authentication Routes
**Base Path:** `/api/auth`

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| POST | `/login` | User login | None |
| POST | `/logout` | User logout | Required |
| POST | `/refresh` | Refresh access token | None |

## Domains Routes
**Base Path:** `/api/domains`

| Method | Endpoint | Description | Authentication | Permissions |
|--------|----------|-------------|----------------|-------------|
| GET | `/` | Get all domains | None | Public |
| POST | `/` | Create new domain | Required | Admin only |
| PUT | `/:id` | Update domain | Required | Admin only |
| DELETE | `/:id` | Delete domain | Required | Admin only |

## News Routes
**Base Path:** `/api/news`

| Method | Endpoint | Description | Authentication | Permissions |
|--------|----------|-------------|----------------|-------------|
| GET | `/` | Get all news articles | None | Public |
| POST | `/` | Create new article | Required | Contributor/Admin |
| PUT | `/:id` | Update article | Required | Owner/Editors/Admin |
| DELETE | `/:id` | Delete article | Required | Owner/Admin |
| GET | `/search` | Search articles | None | Public |
| POST | `/:id/grant-edit` | Grant edit access | Required | Owner/Admin |

## Users Routes
**Base Path:** `/api/users`

| Method | Endpoint | Description | Authentication | Permissions |
|--------|----------|-------------|----------------|-------------|
| GET | `/` | Get all users | Required | Admin only |
| POST | `/` | Create new user | Required | Admin only |
| PUT | `/:id` | Update user | Required | Admin only |
| DELETE | `/:id` | Delete user | Required | Admin only |

## Subscribers Routes
**Base Path:** `/api/subscribers`

| Method | Endpoint | Description | Authentication | Permissions |
|--------|----------|-------------|----------------|-------------|
| GET | `/` | Get all subscribers | Required | Admin only |
| POST | `/` | Add new subscriber | Required | Authenticated |
| DELETE | `/:id` | Remove subscriber | Required | Admin only |

## Audit Routes
**Base Path:** `/api/audit`

| Method | Endpoint | Description | Authentication | Permissions |
|--------|----------|-------------|----------------|-------------|
| GET | `/` | Get audit logs | Required | Admin only |

## Authentication Requirements

### Token-Based Authentication
Most routes (except public ones) require a valid JWT token:
- Tokens can be sent in cookies (`accessToken`)
- Or in the Authorization header (`Authorization: Bearer <token>`)

### Role-Based Permissions
- **Public**: No authentication required
- **Authenticated**: Any logged-in user
- **Contributor**: Can create, edit, and delete their own articles
- **Admin**: Full access to all features

## Error Responses

All routes return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error