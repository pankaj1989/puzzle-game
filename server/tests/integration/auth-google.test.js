jest.mock('../../src/services/googleAuthService');
const googleAuthService = require('../../src/services/googleAuthService');

const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('POST /auth/google', () => {
  it('creates new user from Google profile', async () => {
    googleAuthService.verifyIdToken.mockResolvedValue({
      googleId: 'g-123', email: 'g@b.com', emailVerified: true, displayName: 'Google User',
    });
    const res = await request(app()).post('/auth/google').send({ idToken: 'fake' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const user = await User.findOne({ email: 'g@b.com' });
    expect(user.googleId).toBe('g-123');
  });

  it('links to existing user by email', async () => {
    await User.create({ email: 'g@b.com', passwordHash: 'x' });
    googleAuthService.verifyIdToken.mockResolvedValue({
      googleId: 'g-123', email: 'g@b.com', emailVerified: true, displayName: null,
    });
    await request(app()).post('/auth/google').send({ idToken: 'fake' });
    const user = await User.findOne({ email: 'g@b.com' });
    expect(user.googleId).toBe('g-123');
  });

  it('rejects invalid token', async () => {
    googleAuthService.verifyIdToken.mockRejectedValue(new Error('bad'));
    const res = await request(app()).post('/auth/google').send({ idToken: 'fake' });
    expect(res.status).toBe(401);
  });
});
