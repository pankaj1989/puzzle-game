const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
registerHooks();
const app = () => getApp();

describe('POST /auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    await createUser({ email: 'x@b.com', password: 'password123' });
    const res = await request(app()).post('/auth/login')
      .send({ email: 'x@b.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    await createUser({ email: 'x@b.com', password: 'password123' });
    const res = await request(app()).post('/auth/login')
      .send({ email: 'x@b.com', password: 'wrong1234' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app()).post('/auth/login')
      .send({ email: 'no@b.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('login timing is similar for unknown email vs wrong password (both run bcrypt)', async () => {
    const { createUser, request, getApp } = require('../helpers');
    const app = getApp();
    await createUser({ email: 'exists@b.com', password: 'password123' });

    const t0 = Date.now();
    await request(app).post('/auth/login').send({ email: 'unknown@b.com', password: 'anything' });
    const tUnknown = Date.now() - t0;

    const t1 = Date.now();
    await request(app).post('/auth/login').send({ email: 'exists@b.com', password: 'wrongpass' });
    const tWrong = Date.now() - t1;

    // Both should be in a similar ballpark (bcrypt dominates). Allow generous slack.
    // If the unknown-email path was skipping bcrypt, the ratio would typically exceed 3x.
    const ratio = Math.max(tUnknown, tWrong) / Math.max(Math.min(tUnknown, tWrong), 1);
    expect(ratio).toBeLessThan(3);
  });
});
