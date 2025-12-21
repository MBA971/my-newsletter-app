import dotenv from 'dotenv';
import validateConfig from '../utils/configValidator.js';

// Load environment variables
dotenv.config();

// Validate configuration before proceeding
validateConfig();

const config = {
    port: parseInt(process.env.PORT || '3000'),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    env: process.env.NODE_ENV || 'development',
    db: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || (process.env.NODE_ENV === 'production' ? 'db' : 'localhost'),
        database: process.env.DB_NAME || 'newsletter_app',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5433'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false, // Enable SSL in production
    },
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        prefix: process.env.REDIS_PREFIX || 'newsletter:',
        ttl: parseInt(process.env.REDIS_TTL || '3600'), // Default 1 hour
    },
    jwt: {
        secret: process.env.JWT_SECRET || (() => {
            console.warn('⚠️ Warning: Using default JWT secret. This is insecure for production!');
            return 'dev_secret_key_that_should_be_changed_in_production';
        })(),
        refreshSecret: process.env.JWT_REFRESH_SECRET || (() => {
            console.warn('⚠️ Warning: Using default JWT refresh secret. This is insecure for production!');
            return 'dev_refresh_secret_key_that_should_be_changed_in_production';
        })(),
        accessExpiration: process.env.JWT_ACCESS_EXPIRATION_MS
            ? parseInt(process.env.JWT_ACCESS_EXPIRATION_MS)
            : 15 * 60 * 1000, // 15 minutes
        refreshExpiration: process.env.JWT_REFRESH_EXPIRATION_MS
            ? parseInt(process.env.JWT_REFRESH_EXPIRATION_MS)
            : 7 * 24 * 60 * 60 * 1000, // 7 days
        rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    }
};

export default config;
