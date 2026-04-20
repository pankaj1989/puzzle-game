const User = require('../models/User');
const { hashPassword } = require('../services/passwordService');
const { signAccessToken, issueRefreshToken } = require('../services/tokenService');
const { HttpError } = require('../middleware/errorHandler');

async function signup(req, res) {
  const { email, password, displayName } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, 'Email already registered', 'EMAIL_TAKEN');
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, displayName });
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.status(201).json({ accessToken, refreshToken, user });
}

module.exports = { signup };
