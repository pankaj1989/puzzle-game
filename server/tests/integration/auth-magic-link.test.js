jest.mock('../../src/services/emailService');

const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const emailService = require('../../src/services/emailService');
const User = require('../../src/models/User');
const MagicLinkToken = require('../../src/models/MagicLinkToken');

registerHooks();
const app = () => getApp();

describe('magic link flow', () => {
  beforeEach(() => { emailService.sendMagicLink.mockResolvedValue({ ok: true }); });

  it('POST /auth/magic/request issues token and emails link for existing user', async () => {
    await User.create({ email: 'm@b.com' });
    const res = await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    expect(res.status).toBe(202);
    expect(emailService.sendMagicLink).toHaveBeenCalledTimes(1);
    const link = emailService.sendMagicLink.mock.calls[0][1];
    expect(link).toMatch(/token=/);
  });

  it('POST /auth/magic/verify marks existing user as verified and returns tokens', async () => {
    // Pre-create the user so magic/request issues a token for us
    await User.create({ email: 'm@b.com' });
    await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    const link = emailService.sendMagicLink.mock.calls[0][1];
    const token = new URL(link).searchParams.get('token');
    const res = await request(app()).post('/auth/magic/verify').send({ token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const user = await User.findOne({ email: 'm@b.com' });
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it('rejects reused token', async () => {
    await User.create({ email: 'm@b.com' });
    await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    const link = emailService.sendMagicLink.mock.calls[0][1];
    const token = new URL(link).searchParams.get('token');
    await request(app()).post('/auth/magic/verify').send({ token });
    const res = await request(app()).post('/auth/magic/verify').send({ token });
    expect(res.status).toBe(401);
  });

  it('POST /auth/magic/request returns 202 for unknown email without creating token or sending', async () => {
    const res = await request(app()).post('/auth/magic/request').send({ email: 'nobody@b.com' });
    expect(res.status).toBe(202);
    expect(emailService.sendMagicLink).not.toHaveBeenCalled();
    const count = await MagicLinkToken.countDocuments();
    expect(count).toBe(0);
  });

  it('POST /auth/magic/verify with any token for non-existent user still returns 401', async () => {
    // If no user exists and no token was ever created, verify should return 401
    const res = await request(app()).post('/auth/magic/verify').send({ token: 'fake-token-bytes' });
    expect(res.status).toBe(401);
  });
});
