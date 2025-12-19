import bcrypt from 'bcrypt';
import config from './config/config.js';
import pool from './utils/database.js';

const createDomainAdmins = async () => {
  try {
    console.log('Creating domain admin users...');
    
    // Get all domains
    const domainsResult = await pool.query('SELECT id, name FROM domains ORDER BY id');
    const domains = domainsResult.rows;
    
    console.log(`Found ${domains.length} domains:`);
    domains.forEach(domain => {
      console.log(`  - ${domain.name} (ID: ${domain.id})`);
    });
    
    // Create a domain admin for each domain
    for (const domain of domains) {
      const username = `${domain.name.toLowerCase()}_admin`;
      const email = `${username}@company.com`;
      const password = 'Password123!'; // Default password
      
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        console.log(`User ${email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const saltRounds = config.jwt.rounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Create domain admin user
      const result = await pool.query(
        'INSERT INTO users (username, email, password, role, domain_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, email, hashedPassword, 'domain_admin', domain.id]
      );
      
      console.log(`Created domain admin for ${domain.name}:`);
      console.log(`  Username: ${result.rows[0].username}`);
      console.log(`  Email: ${result.rows[0].email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Domain ID: ${result.rows[0].domain_id}`);
      console.log('');
    }
    
    console.log('Domain admin users created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating domain admin users:', error);
    process.exit(1);
  }
};

createDomainAdmins();