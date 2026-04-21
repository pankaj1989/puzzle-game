const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

describe('admin users', () => {
  it('GET /admin/users lists paginated', async () => {
    await createUser({ email: 'a@x.com' });
    await createUser({ email: 'b@x.com' });
    const res = await request(app()).get('/admin/users').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });

  it('GET /admin/users filters by q email substring', async () => {
    await createUser({ email: 'alice@x.com' });
    await createUser({ email: 'bob@x.com' });
    const res = await request(app()).get('/admin/users?q=alice').set(authHeader(await admin()));
    expect(res.body.users.some(u => u.email === 'alice@x.com')).toBe(true);
    expect(res.body.users.some(u => u.email === 'bob@x.com')).toBe(false);
  });

  it('PATCH /admin/users/:id updates role', async () => {
    const target = await createUser({ email: 'target@x.com' });
    const res = await request(app()).patch(`/admin/users/${target._id}`).set(authHeader(await admin()))
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  it('PATCH updates plan', async () => {
    const target = await createUser({ email: 'target@x.com' });
    const res = await request(app()).patch(`/admin/users/${target._id}`).set(authHeader(await admin()))
      .send({ plan: 'premium' });
    expect(res.body.user.plan).toBe('premium');
  });

  it('PATCH rejects unknown field', async () => {
    const target = await createUser({ email: 'target@x.com' });
    const res = await request(app()).patch(`/admin/users/${target._id}`).set(authHeader(await admin()))
      .send({ email: 'hacker@x.com' });
    expect(res.status).toBe(400);
  });

  it('PATCH 404 on unknown user', async () => {
    const mongoose = require('mongoose');
    const id = new mongoose.Types.ObjectId();
    const res = await request(app()).patch(`/admin/users/${id}`).set(authHeader(await admin()))
      .send({ role: 'admin' });
    expect(res.status).toBe(404);
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'u@x.com' });
    const res = await request(app()).get('/admin/users').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
