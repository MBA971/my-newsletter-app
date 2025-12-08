// Script to generate all bcrypt hashes for the database
// Run with: node generate-all-hashes.js

import bcrypt from 'bcrypt';

async function generateAllHashes() {
    const passwords = {
        'tech123': 'tech_contributor',
        'business123': 'business_contributor',
        'design123': 'design_contributor',
        'culture123': 'culture_contributor',
        'science123': 'science_contributor',
        'admin123': 'admin',
        'user123': 'user1 and user2'
    };
    
    const saltRounds = 12;
    
    console.log('🔐 Generating bcrypt hashes for all users...\n');
    
    for (const [password, description] of Object.entries(passwords)) {
        console.log(`👤 ${description}:`);
        console.log(`   Password: ${password}`);
        
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(`   Hash: ${hash}`);
        console.log(`   Length: ${hash.length}`);
        
        // Test the hash
        const isValid = await bcrypt.compare(password, hash);
        console.log(`   Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    }
}

generateAllHashes();