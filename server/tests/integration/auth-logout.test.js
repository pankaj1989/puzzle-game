const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const { issueRefreshToken } = require('../../src/services/tokenService');
registerHooks();
const app = () => getApp();

describe('POST /auth/logout', () => {
  it('revokes the refresh token', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    const res = await request(app()).post('/auth/logout').send({ refreshToken: token });
    expect(res.status).toBe(204);
    const res2 = await request(app()).post('/auth/refresh').send({ refreshToken: token });
    expect(res2.status).toBe(401);
  });
});
