jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const PremiumPurchase = require('../../src/models/PremiumPurchase');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('POST /billing/payment-intent', () => {
  beforeEach(() => {
    stripeService.ensureCustomer.mockResolvedValue('cus_1');
    stripeService.createPaymentIntent.mockResolvedValue({
      clientSecret: 'pi_secret',
      paymentIntentId: 'pi_1',
    });
  });

  it('401 without token', async () => {
    const res = await request(app()).post('/billing/payment-intent').send({});
    expect(res.status).toBe(401);
  });

  it('returns clientSecret for authed user at fixed price', async () => {
    const user = await createUser();
    const res = await request(app()).post('/billing/payment-intent').set(authHeader(user)).send({});
    expect(res.status).toBe(200);
    expect(res.body.clientSecret).toBe('pi_secret');
    expect(res.body.paymentIntentId).toBe('pi_1');
    expect(res.body.amountCents).toBe(900);
    expect(res.body.currency).toBe('usd');
    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({
      amount: 900,
      currency: 'usd',
      customer: 'cus_1',
      metadata: expect.objectContaining({
        userId: user._id.toString(),
      }),
    }));

    const purchase = await PremiumPurchase.findOne({ userId: user._id });
    expect(purchase.status).toBe('pending');
    expect(purchase.stripePaymentIntentId).toBe('pi_1');
    expect(purchase.amountCents).toBe(900);
  });

  it('409 when user already premium', async () => {
    const user = await createUser({ plan: 'premium' });
    const res = await request(app()).post('/billing/payment-intent').set(authHeader(user)).send({});
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
