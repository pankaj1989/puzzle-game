const bcrypt = require('bcrypt');
const ROUNDS = 12;

// Computed at module load. Used to equalize login timing when user does not exist.
// The hash is of a cryptographically random value so no known plaintext can match it.
const DUMMY_HASH = bcrypt.hashSync(require('crypto').randomBytes(32).toString('hex'), ROUNDS);

async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword, DUMMY_HASH };
