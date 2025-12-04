# Alenia Pulse

**Consulting & Connection** - Secure internal newsletter platform for Alenia.

![Alenia Pulse Logo](public/alenia_logo.png)

## 🎯 Description

Alenia Pulse is an internal communication platform that keeps consultants connected and informed. The application offers:

- **Content Management** by domains (Hiring, Event, Journey, Communication, Admin)
- **Secure Authentication** with JWT and bcrypt
- **Role-Based Access Control** (Admin, Contributor, User)
- **Modern Interface** with responsive design and smooth animations
- **Dockerized Deployment** for easy scaling and maintenance

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MBAlenia/ALENIA_Pulse.git
cd ALENIA_Pulse

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your values

# Start the database (Docker)
docker-compose up -d db

# Create the database
node create-db.js

# Seed with sample data
node seed-database.js

# Migrate passwords (if needed)
node migrate-passwords.js

# Start the application
npm run start-secure
```

The application will be accessible at:
- Frontend: http://localhost:5174
- Backend: http://localhost:3002

## 🔐 Security Features

The application implements industry-standard security practices:

- ✅ **JWT Authentication** with access and refresh tokens
- ✅ **bcrypt Password Hashing** (12 rounds)
- ✅ **HttpOnly Cookies** for token storage
- ✅ **Rate Limiting** (5 login attempts / 15 min)
- ✅ **Input Validation** with express-validator
- ✅ **Security Headers** with Helmet
- ✅ **CORS** configured for authorized origins
- ✅ **Role-Based Access Control** for API endpoints

## 👥 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | admin123 |
| Hiring | hiring@company.com | hiring123 |
| Events | events@company.com | event123 |

## 🐳 Production Deployment

```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose-prod.yml up -d --build
```

The application will be accessible at:
- Frontend: https://pulse.academy.alenia.io
- Backend API: https://pulse-api.academy.alenia.io
- PgAdmin: https://pgadmin.pulse.academy.alenia.io

### Production Environment Setup

1. Create a `.env` file with your production values:
   ```bash
   cp .env.production.example .env
   ```

2. Edit the `.env` file and set your secure values:
   - Strong database passwords
   - Generated JWT secrets (use the command below)
   - Secure PgAdmin password

3. Generate secure JWT secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Deploy with Docker Compose:
   ```bash
   docker-compose -f docker-compose-prod.yml up -d --build
   ```

### Production Environment Variables

Create a `.env` file with:

```env
# Database Configuration
POSTGRES_USER_PROD=your_db_user
POSTGRES_PASSWORD_PROD=your_secure_db_password  # ⚠️ CHANGE THIS!
POSTGRES_DB_PROD=newsletter

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET_PROD=your_generated_jwt_secret_here  # ⚠️ CHANGE THIS!
JWT_REFRESH_SECRET_PROD=your_generated_refresh_secret_here  # ⚠️ CHANGE THIS!

# PgAdmin Configuration
PGADMIN_PASSWORD_PROD=your_secure_pgadmin_password  # ⚠️ CHANGE THIS!

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# URLs
APP_URL=https://pulse.academy.alenia.io
FRONTEND_URL=https://pulse.academy.alenia.io
ALLOWED_ORIGINS=https://pulse.academy.alenia.io
```

⚠️ **Important**: For production use, never use the placeholder values shown above. Always generate secure passwords and secrets.

For a complete production environment template, see `.env.production.example`.

##  troubleshoot Troubleshooting

### Database Connection Issues

If you see errors like `Error: connect ECONNREFUSED`, check:

1. **Verify all environment variables are set correctly** in your `.env` file
2. **Check that the PostgreSQL container is running**:
   ```bash
   docker-compose -f docker-compose-prod.yml ps
   ```
3. **Verify network connectivity between containers**:
   ```bash
   docker-compose -f docker-compose-prod.yml exec backend ping postgres
   ```
4. **Check PostgreSQL logs**:
   ```bash
   docker-compose -f docker-compose-prod.yml logs postgres
   ```

### Common Fixes

1. **Ensure your `.env` file has actual values** (not placeholders)
2. **Restart all services**:
   ```bash
   docker-compose -f docker-compose-prod.yml down
   docker-compose -f docker-compose-prod.yml up -d --build
   ```

## 🏗️ Architecture

### Frontend
- **Framework**: React 19 with Hooks
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React
- **State Management**: React built-in useState/useEffect

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with node-postgres
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Traefik (Production)
- **Database Admin**: PgAdmin

## 📁 Project Structure

```
.
├── src/                    # Frontend source code (React)
│   ├── App.jsx            # Main component
│   ├── App.css            # Styles
│   └── main.jsx           # Entry point
├── middleware/            # Backend middlewares
│   ├── auth.js           # JWT authentication
│   └── validators.js     # Data validation
├── public/               # Static assets
├── Dockerfile.backend    # Backend Docker image (uses secure server)
├── Dockerfile.frontend   # Frontend Docker image
├── server-secure.js      # Secure Express server
├── seed-database.js      # Sample data population
├── create-db.js          # Database creation script
├── migrate-passwords.js  # Password migration utility
└── docker-compose-prod.yml # Production configuration
```

## 🛠️ Development Scripts

- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run server` - Start backend server
- `npm run server-secure` - Start secure backend server
- `npm run start` - Start both frontend and backend
- `npm run start-secure` - Start both frontend and secure backend

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Domains
- `GET /api/domains` - Get all domains
- `POST /api/domains` - Create new domain (Admin only)
- `DELETE /api/domains/:id` - Delete domain (Admin only)

### News
- `GET /api/news` - Get all news
- `POST /api/news` - Create news (Contributor/Admin)
- `DELETE /api/news/:id` - Delete news (Owner/Admin)
- `GET /api/news/search?q=query` - Search news

### Users
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Subscribers
- `GET /api/subscribers` - Get all subscribers (Admin only)

## 📝 License

Property of Alenia - All rights reserved

## 👨‍💻 Author

Michel Barnabot - michel.barnabot@alenia.io

## 📋 Changelog

### v1.2.0 - Latest Release
- Enhanced UI/UX with modern design
- Improved security with JWT refresh tokens
- Dockerized deployment with Traefik integration
- Role-based access control implementation
- Input validation and sanitization
- Rate limiting for brute-force protection

### v1.1.0
- Initial secure implementation with JWT authentication
- Database schema with domains, news, users, and subscribers
- Basic CRUD operations for all entities
- Docker configuration for development and production

### v1.0.0
- Initial release with basic newsletter functionality
- Simple authentication system
- Monolithic architecture