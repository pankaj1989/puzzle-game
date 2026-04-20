jest.mock('stripe', () => {
  const instance = {
    checkout: { sessions: { create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
    customers: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  };
  const factory = jest.fn(() => instance);
  factory._instance = instance;
  return factory;
});

const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const stripeSdk = require('stripe');
const Subscription = require('../../src/models/Subscription');

registerHooks();

const sdkInstance = stripeSdk._instance;

describe('stripeService', () => {
  let svc;
  beforeAll(() => {
    svc = require('../../src/services/stripeService');
  });

  beforeEach(() => {
    sdkInstance.checkout.sessions.create.mockReset();
    sdkInstance.billingPortal.sessions.create.mockReset();
    sdkInstance.customers.create.mockReset();
    sdkInstance.webhooks.constructEvent.mockReset();
  });

  it('creates a checkout session with expected params', async () => {
    sdkInstance.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout', id: 'cs_1' });
    const out = await svc.createCheckoutSession({
      customer: 'cus_1', priceId: 'price_1', userId: 'u1',
      successUrl: 'http://s', cancelUrl: 'http://c',
    });
    expect(sdkInstance.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      customer: 'cus_1',
      line_items: [{ price: 'price_1', quantity: 1 }],
      success_url: 'http://s',
      cancel_url: 'http://c',
      client_reference_id: 'u1',
    }));
    expect(out).toEqual({ url: 'https://checkout', sessionId: 'cs_1' });
  });

  it('creates portal session', async () => {
    sdkInstance.billingPortal.sessions.create.mockResolvedValue({ url: 'https://portal' });
    const out = await svc.createPortalSession({ customer: 'cus_1', returnUrl: 'http://r' });
    expect(out).toEqual({ url: 'https://portal' });
    expect(sdkInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'http://r',
    });
  });

  it('verifies webhook passes raw body and signature', () => {
    sdkInstance.webhooks.constructEvent.mockReturnValue({ type: 'x' });
    const ev = svc.verifyWebhook(Buffer.from('{}'), 'sig123');
    expect(sdkInstance.webhooks.constructEvent).toHaveBeenCalledWith(Buffer.from('{}'), 'sig123', expect.any(String));
    expect(ev).toEqual({ type: 'x' });
  });

  it('ensureCustomer reuses existing sub customer id', async () => {
    const userId = new mongoose.Types.ObjectId();
    await Subscription.create({
      userId, stripeCustomerId: 'cus_existing', stripeSubscriptionId: 'sub_X',
      status: 'active', currentPeriodEnd: new Date(),
    });
    const cid = await svc.ensureCustomer({ user: { _id: userId, email: 'x@y.com' } });
    expect(cid).toBe('cus_existing');
    expect(sdkInstance.customers.create).not.toHaveBeenCalled();
  });

  it('ensureCustomer creates one if no sub exists', async () => {
    sdkInstance.customers.create.mockResolvedValue({ id: 'cus_new' });
    const userId = new mongoose.Types.ObjectId();
    const cid = await svc.ensureCustomer({ user: { _id: userId, email: 'x@y.com' } });
    expect(cid).toBe('cus_new');
    expect(sdkInstance.customers.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'x@y.com' }));
  });
});
