import dotenv from 'dotenv';
dotenv.config();

const config = {
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    env: process.env.NODE_ENV || 'development',
    db: {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'newsletter',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dev_secret_key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key',
        accessExpiration: 15 * 60 * 1000, // 15 minutes
        refreshExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
        rounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    }
};

export default config;
