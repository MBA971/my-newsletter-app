async function testAuth() {
  try {
    // Login
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginResponse.ok) {
      console.error('Login failed');
      return;
    }

    const token = loginData.accessToken;
    console.log('Token:', token);

    // Access users route
    const usersResponse = await fetch('http://localhost:3000/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Users response status:', usersResponse.status);

    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('Users data length:', usersData.length);
    } else {
      const errorData = await usersResponse.json();
      console.error('Users error:', errorData);
    }

    // Access subscribers route
    const subscribersResponse = await fetch('http://localhost:3000/api/subscribers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Subscribers response status:', subscribersResponse.status);

    if (subscribersResponse.ok) {
      const subscribersData = await subscribersResponse.json();
      console.log('Subscribers data length:', subscribersData.length);
    } else {
      const errorData = await subscribersResponse.json();
      console.error('Subscribers error:', errorData);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuth();