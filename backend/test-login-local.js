const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing login to http://localhost:3002/api/auth/login');
        
        const response = await fetch('http://localhost:3002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@company.com',
                password: 'admin123'
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.raw());
        
        const data = await response.json();
        console.log('Response data:', data);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();