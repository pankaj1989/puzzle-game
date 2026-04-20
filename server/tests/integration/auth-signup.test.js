const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('POST /auth/signup', () => {
  it('creates a user and returns tokens', async () => {
    const res = await request(app()).post('/auth/signup')
      .send({ email: 'new@b.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('new@b.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    const stored = await User.findOne({ email: 'new@b.com' });
    expect(stored).not.toBeNull();
  });

  it('rejects duplicate email', async () => {
    await request(app()).post('/auth/signup').send({ email: 'dup@b.com', password: 'password123' });
    const res = await request(app()).post('/auth/signup').send({ email: 'dup@b.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid input', async () => {
    const res = await request(app()).post('/auth/signup').send({ email: 'bad', password: '123' });
    expect(res.status).toBe(400);
  });
});
