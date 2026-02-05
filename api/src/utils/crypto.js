const crypto = require('crypto');

function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateToken, hashToken };
