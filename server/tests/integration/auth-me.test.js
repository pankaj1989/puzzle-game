const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
registerHooks();
const app = () => getApp();

describe('GET /auth/me', () => {
  it('returns current user for valid token', async () => {
    const user = await createUser({ email: 'me@b.com' });
    const res = await request(app()).get('/auth/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@b.com');
  });

  it('401 without token', async () => {
    const res = await request(app()).get('/auth/me');
    expect(res.status).toBe(401);
  });
});
