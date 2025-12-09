import bcrypt from 'bcrypt';

const password = 'admin123';
const saltRounds = 12;

bcrypt.hash(password, saltRounds).then(hash => {
    console.log(`Password: ${password}`);
    console.log(`Valid Hash: ${hash}`);
}).catch(err => console.error(err));
