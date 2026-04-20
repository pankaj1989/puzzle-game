const { registerHooks } = require('../testSetup');
const { createUser } = require('../helpers');
const { issueRefreshToken, rotateRefreshToken } = require('../../src/services/tokenService');
const RefreshToken = require('../../src/models/RefreshToken');

registerHooks();

describe('rotateRefreshToken atomicity', () => {
  it('concurrent rotations of the same token: exactly one succeeds', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    const results = await Promise.allSettled([
      rotateRefreshToken(token),
      rotateRefreshToken(token),
    ]);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/invalid/i);
  });

  it('the old token is revoked exactly once', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    await rotateRefreshToken(token);
    const records = await RefreshToken.find({}).sort({ createdAt: 1 });
    const revoked = records.filter(r => r.revokedAt);
    expect(revoked).toHaveLength(1);
  });
});
