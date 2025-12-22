// Script to test the hash directly
// Run with: node test-direct-hash.js

import bcrypt from 'bcrypt';

async function testDirectHash() {
    const password = 'admin123';
    const hash = '$2b$12$oDcThZdNk47dU.MigZnRoenzhhjNfj.5c8YFJ10mYwUG5iIF8oR2eO';
    
    console.log('🔐 Testing hash directly:');
    console.log('   Password:', password);
    console.log('   Hash:', hash);
    console.log('   Hash length:', hash.length);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('✅ Verification result:', isValid ? 'SUCCESS' : 'FAILED');
    
    // Let's also generate a new hash and compare
    console.log('\n🔄 Generating new hash for comparison:');
    const newHash = await bcrypt.hash(password, 12);
    console.log('   New hash:', newHash);
    console.log('   New hash length:', newHash.length);
    
    const newIsValid = await bcrypt.compare(password, newHash);
    console.log('✅ New hash verification:', newIsValid ? 'SUCCESS' : 'FAILED');
}

testDirectHash();