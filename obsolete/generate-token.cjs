const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 25, email: 'hiring@alenia.com', username: 'hiring_managerb', role: 'contributor' },
  'dev_jwt_secret_key_here_change_me_for_security',
  { expiresIn: '1h' }
);

console.log(token);