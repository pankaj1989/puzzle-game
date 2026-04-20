const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, plan: user.plan },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDurationToMs(str) {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) throw new Error(`Invalid duration: ${str}`);
  const n = Number(m[1]);
  const mult = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
  return n * mult;
}

async function issueRefreshToken(user) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
  await RefreshToken.create({ userId: user._id, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

async function rotateRefreshToken(oldToken) {
  const existing = await RefreshToken.findOne({ tokenHash: hashToken(oldToken) });
  if (!existing) throw new Error('invalid refresh token');
  if (existing.revokedAt) throw new Error('invalid refresh token');
  if (existing.expiresAt < new Date()) throw new Error('invalid refresh token');
  existing.revokedAt = new Date();
  await existing.save();
  const User = require('../models/User');
  const user = await User.findById(existing.userId);
  if (!user) throw new Error('invalid refresh token');
  const next = await issueRefreshToken(user);
  return { ...next, user };
}

async function revokeRefreshToken(token) {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(token) },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeAllForUser(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = {
  signAccessToken, verifyAccessToken,
  issueRefreshToken, rotateRefreshToken, revokeRefreshToken,
  revokeAllForUser,
};
