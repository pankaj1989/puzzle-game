const crypto = require('crypto');
const User = require('../models/User');
const MagicLinkToken = require('../models/MagicLinkToken');
const env = require('../config/env');
const emailService = require('../services/emailService');
const { hashPassword, verifyPassword } = require('../services/passwordService');
const { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../services/tokenService');
const googleAuthService = require('../services/googleAuthService');
const { HttpError } = require('../middleware/errorHandler');

function hashSha(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.status(204).end();
}

async function magicRequest(req, res) {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.MAGIC_LINK_TTL_MINUTES * 60 * 1000);
  await MagicLinkToken.create({ email, tokenHash: hashSha(token), expiresAt });
  const link = `${env.MAGIC_LINK_REDIRECT_URL}?token=${token}`;
  await emailService.sendMagicLink(email, link);
  res.status(202).json({ ok: true });
}

async function magicVerify(req, res) {
  const { token } = req.body;
  const record = await MagicLinkToken.findOne({ tokenHash: hashSha(token) });
  if (!record || record.consumedAt || record.expiresAt < new Date()) {
    throw new HttpError(401, 'Invalid or expired token', 'INVALID_MAGIC_TOKEN');
  }
  record.consumedAt = new Date();
  await record.save();
  let user = await User.findOne({ email: record.email });
  if (!user) {
    user = await User.create({ email: record.email, emailVerifiedAt: new Date() });
  } else if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.json({ accessToken, refreshToken, user });
}

async function google(req, res) {
  const { idToken } = req.body;
  let profile;
  try {
    profile = await googleAuthService.verifyIdToken(idToken);
  } catch {
    throw new HttpError(401, 'Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }
  let user = await User.findOne({ $or: [{ googleId: profile.googleId }, { email: profile.email }] });
  if (!user) {
    user = await User.create({
      email: profile.email,
      googleId: profile.googleId,
      displayName: profile.displayName,
      emailVerifiedAt: profile.emailVerified ? new Date() : null,
    });
  } else {
    if (!user.googleId) user.googleId = profile.googleId;
    if (!user.emailVerifiedAt && profile.emailVerified) user.emailVerifiedAt = new Date();
    if (!user.displayName && profile.displayName) user.displayName = profile.displayName;
    await user.save();
  }
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.json({ accessToken, refreshToken, user });
}

module.exports = { signup, login, refresh, logout, magicRequest, magicVerify, google };
