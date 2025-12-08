import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('=== LOGIN ENDPOINT TEST ===');

// Test data
const loginData = {
  email: 'admin@company.com',
  password: 'admin123'
};

console.log('Test login data:', loginData);

// Simulate what happens in the login endpoint
console.log('\n=== SIMULATING LOGIN PROCESS ===');

// Check environment variables
console.log('Environment Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? `SET (${process.env.JWT_SECRET.length} chars)` : 'NOT SET');
console.log('- JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? `SET (${process.env.JWT_REFRESH_SECRET.length} chars)` : 'NOT SET');

// Show what the default secrets would be
if (!process.env.JWT_SECRET) {
  console.log('- DEFAULT JWT_SECRET would be used: "your-super-secret-jwt-key-change-this-in-production"');
}

if (!process.env.JWT_REFRESH_SECRET) {
  console.log('- DEFAULT JWT_REFRESH_SECRET would be used: "your-super-secret-refresh-key-change-this-in-production"');
}

console.log('\nTo test the actual login endpoint, you can use curl:');
console.log('');
console.log('curl -X POST https://pulse-api.academy.alenia.io/api/auth/login \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"admin@company.com","password":"admin123"}\'');
console.log('');

console.log('Or with verbose output:');
console.log('');
console.log('curl -v -X POST https://pulse-api.academy.alenia.io/api/auth/login \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"admin@company.com","password":"admin123"}\'');
console.log('');