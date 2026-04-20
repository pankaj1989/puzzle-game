const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');

registerHooks();
const app = () => getApp();

describe('profile endpoints', () => {
  it('GET /profile returns user', async () => {
    const user = await createUser({ email: 'p@b.com' });
    const res = await request(app()).get('/profile').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('p@b.com');
  });

  it('PATCH /profile updates displayName', async () => {
    const user = await createUser({ email: 'p@b.com' });
    const res = await request(app())
      .patch('/profile')
      .set(authHeader(user))
      .send({ displayName: 'NewName' });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe('NewName');
  });

  it('PATCH /profile rejects unknown field', async () => {
    const user = await createUser({ email: 'p@b.com' });
    const res = await request(app())
      .patch('/profile')
      .set(authHeader(user))
      .send({ role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('401 without token', async () => {
    const res = await request(app()).get('/profile');
    expect(res.status).toBe(401);
  });
});
