// server/scripts/generateSecret.js
const crypto = require('crypto');

const generateSecret = () => {
  const secret = crypto.randomBytes(64).toString('hex');
  console.log('Add this to your .env file:');
  console.log(`JWT_SECRET=${secret}`);
};

generateSecret();