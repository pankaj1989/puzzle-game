const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Pricing = require('../../src/models/Pricing');

registerHooks();
const app = () => getApp();

describe('GET /pricing', () => {
  it('returns null when nothing configured', async () => {
    const res = await request(app()).get('/pricing');
    expect(res.status).toBe(200);
    expect(res.body.pricing).toBeNull();
  });

  it('returns active pricing', async () => {
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    const res = await request(app()).get('/pricing');
    expect(res.body.pricing.amountCents).toBe(900);
    expect(res.body.pricing.interval).toBe('month');
  });
});

describe('POST /admin/pricing', () => {
  it('401 without token', async () => {
    const res = await request(app()).post('/admin/pricing').send({});
    expect(res.status).toBe(401);
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'regular@test.com' });
    const res = await request(app()).post('/admin/pricing')
      .set(authHeader(user))
      .send({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    expect(res.status).toBe(403);
  });

  it('creates pricing when admin', async () => {
    const admin = await createUser({ email: 'admin@test.com', role: 'admin' });
    const res = await request(app()).post('/admin/pricing')
      .set(authHeader(admin))
      .send({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    expect(res.status).toBe(201);
    expect(res.body.pricing.amountCents).toBe(900);
  });

  it('deactivates prior pricing when new row is created', async () => {
    const admin = await createUser({ email: 'admin@test.com', role: 'admin' });
    await request(app()).post('/admin/pricing').set(authHeader(admin))
      .send({ stripePriceId: 'price_old', amountCents: 500, currency: 'usd', interval: 'month' });
    await request(app()).post('/admin/pricing').set(authHeader(admin))
      .send({ stripePriceId: 'price_new', amountCents: 1200, currency: 'usd', interval: 'month' });
    const active = await Pricing.findOne({ active: true });
    expect(active.stripePriceId).toBe('price_new');
    const oldRow = await Pricing.findOne({ stripePriceId: 'price_old' });
    expect(oldRow.active).toBe(false);
  });
});
