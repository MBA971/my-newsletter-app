import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Generate a test token for hiring_manager (user ID 25)
const testUser = {
  userId: 25,
  email: 'hiring@company.com',
  username: 'hiring_manager',
  role: 'contributor'
};

const token = jwt.sign(testUser, 'dev_jwt_secret_key_here_change_me_for_security', { expiresIn: '1h' });
console.log('Test token:', token);

// Make a request to the contributor endpoint
fetch('http://localhost:3002/api/news/contributor', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
  console.log('Number of articles:', data.length);
})
.catch(error => {
  console.error('Error:', error);
});