# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-12-20

### Added
- Modern theme system with macOS and Windows 11 styles
- Redis-based caching system for improved performance
- Theme selector in user profile modal
- Comprehensive theme documentation
- Domain-specific filtering for domain administrators
- Enhanced error handling with notification system
- Improved security with rate limiting and input validation
- Better user experience with consistent version display

### Changed
- Implemented Model-View-Controller architecture for better code organization
- Separated business logic from presentation components
- Updated API service files with Docker URL resolution fixes
- Enhanced user profile modal with theme selection
- Improved domain admin access controls for news management
- Optimized component structure with better separation of concerns

### Fixed
- Domain assignment issues for contributors and domain admins
- React development error with static flag
- API URL resolution in Docker environments
- Caching implementation for database queries
- User experience consistency across different views
- Version display inconsistencies across the application

## [1.3.0] - 2025-12-19

### Added
- Redesigned UI/UX with cleaner, more consistent design across all views
- Enhanced admin dashboard with improved statistics and navigation
- Better responsive design for all device sizes
- Improved accessibility features

### Changed
- Restored original clean design from ALENIA_Pulse-main backup
- Updated ContributorView with simplified layout and consistent styling
- Updated PublicView with cleaner article presentation
- Improved domain color coding consistency across all views

### Fixed
- UI inconsistencies between different views
- Styling issues with domain badges and action buttons
- Layout problems with empty states

## [1.2.1] - 2025-12-08

### Added
- New debugging and analysis scripts for user and news ownership verification
- Database migration utilities for author ID consistency

### Changed
- Improved API URL configuration for Docker environments
- Enhanced contributor view with better UI/UX
- Updated database seeding process with more robust data handling

### Fixed
- API endpoint URL inconsistencies in Docker deployments
- Modal refresh issues when editing content
- Contributor view functionality for news management

## [1.2.0] - 2025-12-04

### Added
- Enhanced UI/UX with modern design inspired by Tailwind CSS best practices
- Improved security with JWT refresh tokens implementation
- Dockerized deployment with Traefik integration for production
- Role-based access control with middleware validation
- Input validation and sanitization using express-validator
- Rate limiting for brute-force protection
- Comprehensive API documentation in README
- Detailed project architecture documentation
- Production-ready environment configuration

### Changed
- Redesigned frontend interface with improved navigation
- Updated authentication flow with refresh token mechanism
- Enhanced error handling and validation responses
- Improved Docker configuration for both development and production
- Optimized database queries and connection management
- Updated README with comprehensive documentation

### Fixed
- Security vulnerabilities in authentication system
- CORS configuration issues
- Database connection stability
- Input validation edge cases

## [1.1.0] - 2025-11-15

### Added
- Secure implementation with JWT authentication
- Database schema with domains, news, users, and subscribers
- Basic CRUD operations for all entities
- Docker configuration for development and production
- Password hashing with bcrypt
- Environment-based configuration management

### Changed
- Migrated from simple authentication to JWT-based system
- Improved database structure and relationships
- Enhanced API endpoint organization
- Updated project documentation

## [1.0.0] - 2025-10-01

### Added
- Initial release with basic newsletter functionality
- Simple authentication system
- Monolithic architecture
- Basic CRUD operations for news items
- Domain categorization system
- User role management (Admin, Contributor, User)