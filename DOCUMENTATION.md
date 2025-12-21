# Alenia Pulse - Newsletter Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [API Endpoints](#api-endpoints)
6. [User Roles and Permissions](#user-roles-and-permissions)
7. [Development Guidelines](#development-guidelines)
8. [Improvements and Fixes](#improvements-and-fixes)

## Overview
Alenia Pulse is a modern newsletter application with role-based access control, domain management, and a responsive UI with theme support. The application allows users to create, manage, and share news articles within designated domains.

## Features
- Role-based access control (super_admin, domain_admin, contributor, user)
- Domain-based content organization
- Article management with validation workflow
- User management system
- Modern UI with macOS and Windows 11 themes
- Real-time notifications
- Search and filtering capabilities
- Archiving functionality
- Audit logging
- Caching system for improved performance

## Architecture
### Frontend
- React 19 with hooks
- Vite for bundling
- Lucide React for icons
- CSS Modules and utility classes
- Responsive design with mobile-first approach

### Backend
- Node.js with Express
- PostgreSQL database with connection pooling
- JWT-based authentication
- Redis for caching (optional)
- Modular controller architecture

### File Structure
```
my-newsletter-app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── modals/
│   │   │   ├── ui/
│   │   │   ├── views/
│   │   │   │   └── admin/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api/
│   │   ├── themes/
│   │   └── styles/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── config/
```

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis (optional, for caching)

### Setup
1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```bash
   cd backend
   npm install
   
   cd ../frontend
   npm install
   ```
3. Set up environment variables in `.env` files
4. Start the application:
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend
   cd frontend
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### Domains
- `GET /api/domains` - Get all domains
- `POST /api/domains` - Create domain (super_admin only)
- `PUT /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain (super_admin only)

### News
- `GET /api/news` - Get all news (public)
- `GET /api/news/:id` - Get news by ID
- `POST /api/news` - Create news (authenticated users)
- `PUT /api/news/:id` - Update news
- `DELETE /api/news/:id` - Delete news
- `GET /api/news/admin` - Get all news for admin (admin only)
- `GET /api/news/contributor` - Get contributor's news
- `GET /api/news/archived` - Get archived news
- `GET /api/news/pending-validation` - Get pending validation news
- `POST /api/news/:id/toggle-archive` - Toggle archive status
- `POST /api/news/:id/validate` - Validate news (admin only)

### Users
- `GET /api/users` - Get all users (super_admin only)
- `GET /api/users/by-domain` - Get users by domain (domain_admin only)
- `POST /api/users` - Create user (super_admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (super_admin only)

### Subscribers
- `GET /api/subscribers` - Get all subscribers (super_admin only)
- `POST /api/subscribers` - Subscribe to newsletter
- `DELETE /api/subscribers/:id` - Delete subscriber (super_admin only)

## User Roles and Permissions

### super_admin
- Full access to all features
- Can manage all users and domains
- Can access all news articles
- Can manage audit logs

### domain_admin
- Can manage users in their assigned domain
- Can manage news articles in their assigned domain
- Can validate pending articles in their domain

### contributor
- Can create and edit articles in their assigned domain
- Can archive/unarchive their own articles
- Cannot delete articles (only archive)

### user
- Can view public articles
- Can subscribe to newsletter
- Limited access to admin features

## Development Guidelines

### Code Standards
- Follow ES6+ JavaScript standards
- Use consistent naming conventions (camelCase for variables/functions)
- Write meaningful comments for complex logic
- Use JSDoc for function documentation

### Component Structure
- Separate business logic from UI components
- Use hooks for state management
- Keep components focused and single-purpose
- Use prop validation where appropriate

### Error Handling
- Use centralized error handling
- Provide user-friendly error messages
- Log errors for debugging purposes
- Use notification system instead of alerts

## Improvements and Fixes

### 1. Theme System Implementation
- **macOS Theme**: Clean, minimalist design with subtle animations and rounded corners
- **Windows 11 Theme**: Sharp, modern design with precise edges and clear typography
- **Theme Selector**: Added theme selection in user profile modal
- **Persistent Preferences**: Theme choices are saved in localStorage
- **CSS Variables**: Implemented theme-specific CSS variables for consistent styling

### 2. Caching System
- **Redis Integration**: Added Redis-based caching for improved performance
- **Database Caching**: Implemented caching for news, user, and domain data
- **Cache Invalidation**: Automatic cache invalidation after CRUD operations
- **Performance Improvement**: Reduced database load and improved response times

### 3. API URL Resolution
- **Docker Compatibility**: Fixed API URL resolution for Docker environments
- **Localhost Fallback**: Proper fallback to localhost when Docker service names detected
- **Multiple Formats**: Support for various Docker service name formats (backend, newsletter_backend, etc.)

### 4. Security Enhancements
- **Rate Limiting**: Implemented API rate limiting to prevent abuse
- **Input Validation**: Added comprehensive input validation using express-validator
- **JWT Security**: Enhanced JWT token security with proper expiration and refresh
- **Authorization**: Improved role-based access control with proper middleware

### 5. User Experience Improvements
- **Notification System**: Replaced browser alerts with elegant notification system
- **Error Handling**: Improved error messages and user feedback
- **Form Validation**: Better validation feedback and error messages
- **Loading States**: Added proper loading indicators

### 6. Code Architecture
- **Model-Controller Separation**: Implemented proper model-controller architecture
- **Component Decomposition**: Broke down large components into smaller, focused ones
- **Service Layer**: Created dedicated service layer for API operations
- **Utility Functions**: Centralized common utilities and helpers

### 7. Domain Assignment Fix
- **Proper Domain Handling**: Fixed issue where domain_admin users weren't properly assigned domains
- **Role-Based Logic**: Ensured domain_admin users can only access their assigned domain
- **Profile Updates**: Properly handle domain field in profile updates based on user role
- **Data Integrity**: Prevented unauthorized domain assignment changes

### 8. Performance Optimizations
- **Database Indexes**: Added proper database indexes for frequently queried fields
- **Query Optimization**: Optimized database queries for better performance
- **Component Memoization**: Used React.memo and useMemo for performance
- **Bundle Size**: Reduced frontend bundle size through code splitting

### 9. Responsive Design
- **Mobile-First**: Implemented mobile-first responsive design
- **Touch Support**: Added touch-friendly controls and gestures
- **Adaptive Layouts**: Created adaptive layouts for different screen sizes

### 10. Accessibility
- **Focus Management**: Proper focus management for keyboard navigation
- **Screen Reader Support**: Added ARIA labels and semantic HTML
- **Color Contrast**: Ensured proper color contrast ratios
- **Keyboard Navigation**: Full keyboard navigation support

### 11. Backend Improvements
- **Database Models**: Created dedicated models for database operations
- **Error Handling**: Implemented centralized error handling middleware
- **Validation**: Added comprehensive request validation
- **Security**: Enhanced security with proper middleware and validation

### 12. Frontend Enhancements
- **State Management**: Improved React state management with hooks
- **Context API**: Implemented proper context management
- **Component Structure**: Better component composition and reusability
- **Theme System**: Implemented dynamic theme switching

## Troubleshooting

### Common Issues
1. **Domain Assignment Issue**: If a user shows "No domain assigned", check that the user has a domain_id assigned in the database
2. **API Connection Issues**: Verify that VITE_API_URL is properly set in the frontend .env file
3. **Caching Issues**: Clear Redis cache if experiencing stale data issues
4. **Theme Issues**: Check browser console for CSS variable errors

### Database Seeding
Run the seed script to populate initial data:
```bash
cd backend
node seed-database.js
```

### Environment Variables
Ensure all required environment variables are set:
- `JWT_SECRET` and `JWT_REFRESH_SECRET` (use strong, unique values in production)
- `DB_*` variables for database connection
- `REDIS_URL` for caching (optional)

## Deployment

### Production Deployment
1. Set NODE_ENV=production
2. Use strong secret keys for JWT
3. Enable SSL/TLS
4. Configure reverse proxy (nginx, Apache)
5. Set up process manager (PM2, systemd)

### Docker Deployment
The application supports Docker deployment with docker-compose configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
MIT License - See LICENSE file for details.

## Support
For support, please contact the development team or submit an issue in the repository.