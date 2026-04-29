jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Pricing = require('../../src/models/Pricing');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('POST /billing/checkout', () => {
  beforeEach(() => {
    stripeService.ensureCustomer.mockResolvedValue('cus_1');
    stripeService.createCheckoutSession.mockResolvedValue({ url: 'https://checkout', sessionId: 'cs_1' });
  });

  it('401 without token', async () => {
    const res = await request(app()).post('/billing/checkout').send({});
    expect(res.status).toBe(401);
  });

  it('409 when no active pricing configured', async () => {
    const user = await createUser();
    const res = await request(app()).post('/billing/checkout').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_ACTIVE_PRICE');
  });

  it('returns url for authed user with pricing set', async () => {
    const user = await createUser();
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    const res = await request(app()).post('/billing/checkout').set(authHeader(user)).send({});
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout');
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_1',
      priceId: 'price_1',
    }));
  });

  it('409 when user already premium', async () => {
    const user = await createUser({ plan: 'premium' });
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    const res = await request(app()).post('/billing/checkout').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_PREMIUM');
  });
});

describe('POST /billing/simulate-success', () => {
  it('401 without token', async () => {
    const res = await request(app()).post('/billing/simulate-success').send({});
    expect(res.status).toBe(401);
  });

  it('marks the authenticated user as premium', async () => {
    const user = await createUser({ plan: 'free' });
    const res = await request(app()).post('/billing/simulate-success').set(authHeader(user)).send({});
    expect(res.status).toBe(200);
    expect(res.body.simulated).toBe(true);
    expect(res.body.user.plan).toBe('premium');

    const refreshed = await User.findById(user._id);
    expect(refreshed.plan).toBe('premium');
  });
});
