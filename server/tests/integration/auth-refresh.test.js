const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const { issueRefreshToken } = require('../../src/services/tokenService');
registerHooks();
const app = () => getApp();

describe('POST /auth/refresh', () => {
  it('rotates refresh token and returns new access', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    const res = await request(app()).post('/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(token);
  });

  it('rejects invalid refresh', async () => {
    const res = await request(app()).post('/auth/refresh').send({ refreshToken: 'bogus' });
    expect(res.status).toBe(401);
  });

  it('rejects reused (now revoked) refresh', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    await request(app()).post('/auth/refresh').send({ refreshToken: token });
    const res = await request(app()).post('/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(401);
  });
});
