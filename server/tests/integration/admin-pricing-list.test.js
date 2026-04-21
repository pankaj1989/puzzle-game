const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Pricing = require('../../src/models/Pricing');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

describe('GET /admin/pricing', () => {
  it('returns full pricing history, newest first', async () => {
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 500, currency: 'usd', interval: 'month', active: false });
    await new Promise(r => setTimeout(r, 10));
    await Pricing.create({ stripePriceId: 'price_2', amountCents: 900, currency: 'usd', interval: 'month', active: true });
    const res = await request(app()).get('/admin/pricing').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.pricing).toHaveLength(2);
    expect(res.body.pricing[0].stripePriceId).toBe('price_2');
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'u@x.com' });
    const res = await request(app()).get('/admin/pricing').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
