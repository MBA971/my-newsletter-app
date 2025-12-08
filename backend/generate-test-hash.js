// Script to generate a bcrypt hash for testing
// Run with: node generate-test-hash.js

import bcrypt from 'bcrypt';

async function generateTestHash() {
    const password = 'admin123';
    const saltRounds = 12;
    
    console.log('🔐 Generating bcrypt hash for:', password);
    console.log('🔢 Salt rounds:', saltRounds);
    
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('🔑 Generated hash:', hash);
    console.log('📏 Hash length:', hash.length);
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('✅ Verification result:', isValid ? 'SUCCESS' : 'FAILED');
    
    // Compare with the hash in the database
    const dbHash = '$2b$12$nL/yH5uF25EO8xppFqzYkeubscnT651HE.tUJdKYXLn7Fxd5f0wQG';
    console.log('\n🔄 Comparing with database hash:');
    console.log('💾 Database hash:', dbHash);
    console.log('📏 Database hash length:', dbHash.length);
    
    const dbValid = await bcrypt.compare(password, dbHash);
    console.log('✅ Database hash verification:', dbValid ? 'SUCCESS' : 'FAILED');
}

generateTestHash();