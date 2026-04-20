const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../services/passwordService');
const { signAccessToken, issueRefreshToken, rotateRefreshToken } = require('../services/tokenService');
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

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  user.lastLoginAt = new Date();
  await user.save();
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.json({ accessToken, refreshToken, user });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;
  try {
    const { token: newRefresh, user } = await rotateRefreshToken(refreshToken);
    const accessToken = signAccessToken(user);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH');
  }
}

module.exports = { signup, login, refresh };
