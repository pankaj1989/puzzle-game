const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const PremiumPurchase = require('../../src/models/PremiumPurchase');

registerHooks();

describe('PremiumPurchase model', () => {
  beforeAll(async () => {
    await PremiumPurchase.init();
  });

  it('creates with required fields', async () => {
    const p = await PremiumPurchase.create({
      userId: new mongoose.Types.ObjectId(),
      stripeCustomerId: 'cus_123',
      stripeCheckoutSessionId: 'cs_123',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    });
    expect(p.status).toBe('paid');
  });

  it('creates without checkout session id for payment-intent flow', async () => {
    const p = await PremiumPurchase.create({
      userId: new mongoose.Types.ObjectId(),
      stripeCustomerId: 'cus_pi',
      stripePaymentIntentId: 'pi_123',
      status: 'pending',
      amountCents: 900,
      currency: 'usd',
    });
    expect(p.stripeCheckoutSessionId).toBeNull();
    expect(p.status).toBe('pending');
  });

  it('enforces unique stripeCheckoutSessionId', async () => {
    const shared = {
      stripeCustomerId: 'cus_1',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    };
    await PremiumPurchase.create({
      ...shared,
      userId: new mongoose.Types.ObjectId(),
      stripeCheckoutSessionId: 'cs_X',
    });
    await expect(
      PremiumPurchase.create({
        ...shared,
        userId: new mongoose.Types.ObjectId(),
        stripeCheckoutSessionId: 'cs_X',
      })
    ).rejects.toThrow();
  });
});
