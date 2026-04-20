jest.mock('../../src/services/emailService');

const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const emailService = require('../../src/services/emailService');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('magic link flow', () => {
  beforeEach(() => { emailService.sendMagicLink.mockResolvedValue({ ok: true }); });

  it('POST /auth/magic/request issues token and emails link', async () => {
    const res = await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    expect(res.status).toBe(202);
    expect(emailService.sendMagicLink).toHaveBeenCalledTimes(1);
    const link = emailService.sendMagicLink.mock.calls[0][1];
    expect(link).toMatch(/token=/);
  });

  it('POST /auth/magic/verify creates user (if new) and returns tokens', async () => {
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
    await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    const link = emailService.sendMagicLink.mock.calls[0][1];
    const token = new URL(link).searchParams.get('token');
    await request(app()).post('/auth/magic/verify').send({ token });
    const res = await request(app()).post('/auth/magic/verify').send({ token });
    expect(res.status).toBe(401);
  });
});
