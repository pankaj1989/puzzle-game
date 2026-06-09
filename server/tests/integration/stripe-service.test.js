jest.mock('stripe', () => {
  const instance = {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
    customers: { create: jest.fn() },
  };
  const factory = jest.fn(() => instance);
  factory._instance = instance;
  return factory;
});

const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const stripeSdk = require('stripe');
const PremiumPurchase = require('../../src/models/PremiumPurchase');

registerHooks();

const sdkInstance = stripeSdk._instance;

describe('stripeService', () => {
  let svc;
  beforeAll(() => {
    svc = require('../../src/services/stripeService');
  });

  beforeEach(() => {
    sdkInstance.paymentIntents.create.mockReset();
    sdkInstance.paymentIntents.retrieve.mockReset();
    sdkInstance.customers.create.mockReset();
  });

  it('creates a payment intent with expected params', async () => {
    sdkInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_1',
      client_secret: 'pi_secret',
    });
    const out = await svc.createPaymentIntent({
      amount: 900,
      currency: 'usd',
      customer: 'cus_1',
      metadata: { userId: 'u1', priceId: 'price_1' },
    });
    expect(sdkInstance.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 900,
      currency: 'usd',
      customer: 'cus_1',
      metadata: { userId: 'u1', priceId: 'price_1' },
      automatic_payment_methods: { enabled: true },
    }));
    expect(out).toEqual({ clientSecret: 'pi_secret', paymentIntentId: 'pi_1' });
  });

  it('verifies a succeeded payment intent', async () => {
    sdkInstance.paymentIntents.retrieve.mockResolvedValue({
      status: 'succeeded',
      amount: 900,
      currency: 'usd',
      metadata: { userId: 'u1' },
    });
    const result = await svc.verifyPaymentIntent('pi_1');
    expect(result.verified).toBe(true);
    expect(result.status).toBe('succeeded');
    expect(result.amount).toBe(900);
    expect(result.currency).toBe('usd');
    expect(result.metadata).toEqual({ userId: 'u1' });
  });

  it('returns payment receipt url', async () => {
    sdkInstance.paymentIntents.retrieve.mockResolvedValue({
      latest_charge: { receipt_url: 'https://receipt' },
    });
    const url = await svc.getPaymentReceipt('pi_1');
    expect(url).toBe('https://receipt');
    expect(sdkInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_1', {
      expand: ['latest_charge'],
    });
  });

  it('ensureCustomer reuses existing purchase customer id', async () => {
    const userId = new mongoose.Types.ObjectId();
    await PremiumPurchase.create({
      userId,
      stripeCustomerId: 'cus_existing',
      stripeCheckoutSessionId: 'cs_X',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    });
    const cid = await svc.ensureCustomer({ user: { _id: userId, email: 'x@y.com' } });
    expect(cid).toBe('cus_existing');
    expect(sdkInstance.customers.create).not.toHaveBeenCalled();
  });

  it('ensureCustomer creates one if no purchase exists', async () => {
    sdkInstance.customers.create.mockResolvedValue({ id: 'cus_new' });
    const userId = new mongoose.Types.ObjectId();
    const cid = await svc.ensureCustomer({ user: { _id: userId, email: 'x@y.com' } });
    expect(cid).toBe('cus_new');
    expect(sdkInstance.customers.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'x@y.com' }));
  });
});
