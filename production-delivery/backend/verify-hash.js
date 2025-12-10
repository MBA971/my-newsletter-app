import bcrypt from 'bcrypt';

const password = 'admin123';
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PZvO.S';

bcrypt.compare(password, hash).then(result => {
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(`Match: ${result}`);
}).catch(err => console.error(err));
