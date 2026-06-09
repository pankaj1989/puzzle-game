jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const User = require('../../src/models/User');
const PremiumPurchase = require('../../src/models/PremiumPurchase');

registerHooks();
const app = () => getApp();

async function seedPendingPurchase(user, overrides = {}) {
  return PremiumPurchase.create({
    userId: user._id,
    stripeCustomerId: 'cus_1',
    stripePaymentIntentId: 'pi_1',
    status: 'pending',
    amountCents: 900,
    currency: 'usd',
    priceId: 'price_1',
    ...overrides,
  });
}

describe('POST /billing/confirm-payment', () => {
  beforeEach(() => {
    stripeService.verifyPaymentIntent.mockResolvedValue({
      verified: true,
      status: 'succeeded',
      amount: 900,
      currency: 'usd',
      metadata: {},
    });
  });

  it('401 without token', async () => {
    const res = await request(app()).post('/billing/confirm-payment').send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(401);
  });

  it('404 when no purchase exists', async () => {
    const user = await createUser();
    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PAYMENT_NOT_FOUND');
  });

  it('404 when payment intent id does not match', async () => {
    const user = await createUser();
    await seedPendingPurchase(user);
    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_other' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PAYMENT_NOT_FOUND');
  });

  it('promotes user and marks purchase paid on success', async () => {
    const user = await createUser();
    await seedPendingPurchase(user);
    stripeService.verifyPaymentIntent.mockResolvedValue({
      verified: true,
      status: 'succeeded',
      amount: 900,
      currency: 'usd',
      metadata: { userId: user._id.toString() },
    });

    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.plan).toBe('premium');

    const fresh = await User.findById(user._id);
    expect(fresh.plan).toBe('premium');
    const purchase = await PremiumPurchase.findOne({ userId: user._id });
    expect(purchase.status).toBe('paid');
    expect(purchase.paidAt).toBeTruthy();
  });

  it('403 when metadata userId does not match', async () => {
    const user = await createUser();
    await seedPendingPurchase(user);
    stripeService.verifyPaymentIntent.mockResolvedValue({
      verified: true,
      status: 'succeeded',
      amount: 900,
      currency: 'usd',
      metadata: { userId: 'other_user' },
    });

    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PAYMENT_MISMATCH');
  });

  it('409 when payment not succeeded', async () => {
    const user = await createUser();
    await seedPendingPurchase(user);
    stripeService.verifyPaymentIntent.mockResolvedValue({
      verified: false,
      status: 'requires_payment_method',
      amount: 900,
      currency: 'usd',
      metadata: { userId: user._id.toString() },
    });

    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PAYMENT_FAILED');
  });

  it('409 when amount mismatch', async () => {
    const user = await createUser();
    await seedPendingPurchase(user);
    stripeService.verifyPaymentIntent.mockResolvedValue({
      verified: true,
      status: 'succeeded',
      amount: 100,
      currency: 'usd',
      metadata: { userId: user._id.toString() },
    });

    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PAYMENT_MISMATCH');
  });

  it('is idempotent when already paid', async () => {
    const user = await createUser({ plan: 'premium' });
    await PremiumPurchase.create({
      userId: user._id,
      stripeCustomerId: 'cus_1',
      stripePaymentIntentId: 'pi_1',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    });

    const res = await request(app())
      .post('/billing/confirm-payment')
      .set(authHeader(user))
      .send({ paymentIntentId: 'pi_1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(stripeService.verifyPaymentIntent).not.toHaveBeenCalled();
  });
});
