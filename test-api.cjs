const fetch = require('node-fetch');

async function testApi() {
  try {
    console.log('Testing API endpoints...');
    
    // Test the getAll endpoint (super_admin only)
    console.log('\n--- Testing /api/users (getAll) ---');
    const allUsersResponse = await fetch('http://localhost:3002/api/users');
    console.log('Status:', allUsersResponse.status);
    if (allUsersResponse.ok) {
      const allUsers = await allUsersResponse.json();
      console.log('All users:', JSON.stringify(allUsers, null, 2));
    } else {
      console.log('Error:', await allUsersResponse.text());
    }
    
    // Test the getByDomain endpoint (domain_admin)
    console.log('\n--- Testing /api/users/by-domain (getByDomain) ---');
    const domainUsersResponse = await fetch('http://localhost:3002/api/users/by-domain');
    console.log('Status:', domainUsersResponse.status);
    if (domainUsersResponse.ok) {
      const domainUsers = await domainUsersResponse.json();
      console.log('Domain users:', JSON.stringify(domainUsers, null, 2));
    } else {
      console.log('Error:', await domainUsersResponse.text());
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testApi();