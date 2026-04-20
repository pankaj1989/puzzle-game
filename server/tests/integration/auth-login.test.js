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
});
