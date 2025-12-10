const axios = require('axios');

async function testUpdate() {
  try {
    // Login to get token
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'admin@company.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Got token:', token);
    
    // Update news item
    const updateResponse = await axios.put('http://localhost:3002/api/news/31', {
      title: 'Updated Learning Platform Launched',
      domain: '8',  // Send as string like the frontend does
      content: 'We\'re excited to introduce our new learning platform with over 500 courses.'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Update successful:', updateResponse.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testUpdate();