const { registerHooks } = require('../testSetup');
const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const {
  signAccessToken, verifyAccessToken,
  issueRefreshToken, rotateRefreshToken, revokeRefreshToken,
} = require('../../src/services/tokenService');

registerHooks();

describe('tokenService', () => {
  it('signs and verifies access token', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    const token = signAccessToken(user);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(user._id.toString());
    expect(payload.role).toBe('user');
  });

  it('issues and rotates a refresh token', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    const { token } = await issueRefreshToken(user);
    const rotated = await rotateRefreshToken(token);
    expect(rotated.token).not.toBe(token);
    const all = await RefreshToken.find({});
    expect(all.some(t => t.revokedAt)).toBe(true);
  });

  it('rejects unknown refresh token', async () => {
    await expect(rotateRefreshToken('nope.nope.nope')).rejects.toThrow(/invalid/i);
  });

  it('revokes a refresh token', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    const { token } = await issueRefreshToken(user);
    await revokeRefreshToken(token);
    await expect(rotateRefreshToken(token)).rejects.toThrow();
  });

  it('rejects HS512-signed access token (algorithm confusion defense)', () => {
    const jwt = require('jsonwebtoken');
    const env = require('../../src/config/env');
    const badToken = jwt.sign(
      { sub: 'x', role: 'user', plan: 'free' },
      env.JWT_ACCESS_SECRET,
      { algorithm: 'HS512', expiresIn: '15m' }
    );
    const { verifyAccessToken } = require('../../src/services/tokenService');
    expect(() => verifyAccessToken(badToken)).toThrow();
  });
});
