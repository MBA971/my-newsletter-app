import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const password = 'admin123';
const saltRounds = process.env.BCRYPT_ROUNDS ? parseInt(process.env.BCRYPT_ROUNDS) : 12;

console.log('Generating bcrypt hash for password:', password);
console.log('Using salt rounds:', saltRounds);
console.log('==========================================');

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Generated Hash:');
    console.log(hash);
    
    // Also test verifying the password against the hash
    console.log('\nVerifying password against hash...');
    const isMatch = await bcrypt.compare(password, hash);
    console.log('Password matches hash:', isMatch);
    
    // Test against a wrong password
    const isWrongMatch = await bcrypt.compare('wrongpassword', hash);
    console.log('Wrong password matches hash:', isWrongMatch);
  } catch (error) {
    console.error('Error generating hash:', error.message);
  }
}

generateHash();