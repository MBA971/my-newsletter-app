import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { generateAccessToken, generateRefreshToken } from './middleware/auth.js';

// Load environment variables
dotenv.config();

console.log('=== AUTH DEBUG SCRIPT ===');
console.log('Checking authentication configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('====================');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT SET');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? `SET (${process.env.JWT_REFRESH_SECRET.length} chars)` : 'NOT SET');
console.log('BCRYPT_ROUNDS:', process.env.BCRYPT_ROUNDS || 'NOT SET');

// Test JWT token generation
console.log('\n=== JWT TOKEN GENERATION TEST ===');
try {
  const testUser = {
    id: 1,
    email: 'admin@company.com',
    username: 'admin',
    role: 'admin',
    domain: 'admin'
  };

  console.log('Test user:', testUser);
  
  const accessToken = generateAccessToken(testUser);
  console.log('✅ Access token generated successfully');
  
  const refreshToken = generateRefreshToken(testUser);
  console.log('✅ Refresh token generated successfully');
  
  // Try to verify the tokens
  console.log('\n=== TOKEN VERIFICATION TEST ===');
  const verifiedAccess = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
  console.log('✅ Access token verified:', {
    userId: verifiedAccess.userId,
    email: verifiedAccess.email,
    role: verifiedAccess.role
  });
  
  const verifiedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production');
  console.log('✅ Refresh token verified:', {
    userId: verifiedRefresh.userId,
    email: verifiedRefresh.email
  });
  
} catch (error) {
  console.log('❌ Token generation/verification failed:', error.message);
}

// Test bcrypt hashing
console.log('\n=== BCRYPT HASHING TEST ===');
const testPassword = 'admin123';
const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;

console.log('Test password:', testPassword);
console.log('Salt rounds:', saltRounds);

bcrypt.hash(testPassword, saltRounds).then(hash => {
  console.log('✅ Password hashed successfully');
  console.log('Hash length:', hash.length);
  
  // Test verification
  bcrypt.compare(testPassword, hash).then(match => {
    console.log('✅ Password verification test:', match ? 'SUCCESS' : 'FAILED');
  });
  
  bcrypt.compare('wrongpassword', hash).then(match => {
    console.log('✅ Wrong password test:', match ? 'INCORRECTLY MATCHED' : 'CORRECTLY REJECTED');
  });
}).catch(error => {
  console.log('❌ Password hashing failed:', error.message);
});

console.log('\n=== DEBUG SUMMARY ===');
console.log('If you see this message, the debug script ran successfully.');
console.log('Check the logs above for any errors or warnings.');