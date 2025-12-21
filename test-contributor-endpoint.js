const jwt = require('jsonwebtoken');

// Generate a token for user ID 30 (admin/super_admin)
const token = jwt.sign(
  {
    userId: 30,
    email: 'admin@company.com',
    username: 'admin',
    role: 'super_admin'
  },
  'dev_jwt_secret_key_here_change_me_for_security'
);

console.log('Bearer Token:');
console.log(token);

console.log('\nUse this command to test the API:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3002/api/news/contributor`);