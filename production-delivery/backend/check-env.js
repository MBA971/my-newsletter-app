import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment Variables:');
console.log('====================');

console.log('DB_USER:', process.env.DB_USER || 'NOT SET');
console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME || 'NOT SET');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');
console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET');

console.log('BCRYPT_ROUNDS:', process.env.BCRYPT_ROUNDS || 'NOT SET');

console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');