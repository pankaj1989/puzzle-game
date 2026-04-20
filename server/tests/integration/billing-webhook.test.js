jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const User = require('../../src/models/User');
const Subscription = require('../../src/models/Subscription');

registerHooks();
const app = () => getApp();

describe('POST /billing/webhook', () => {
  it('400 when signature invalid', async () => {
    stripeService.verifyWebhook.mockImplementation(() => { throw new Error('bad sig'); });
    const res = await request(app()).post('/billing/webhook')
      .set('stripe-signature', 'bad')
      .set('Content-Type', 'application/json')
      .send('{"anything":true}');
    expect(res.status).toBe(400);
  });

  it('checkout.session.completed promotes user and stores subscription', async () => {
    const user = await createUser({ email: 'pay@test.com' });
    stripeService.verifyWebhook.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: {
        id: 'cs_1',
        client_reference_id: user._id.toString(),
        customer: 'cus_1',
        subscription: 'sub_1',
      }},
    });
    stripeService._stripeInstance = {
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'sub_1',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          items: { data: [{ price: { id: 'price_1' } }] },
          cancel_at_period_end: false,
        }),
      },
    };

    const res = await request(app()).post('/billing/webhook')
      .set('stripe-signature', 'ok')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(res.status).toBe(200);

    const fresh = await User.findById(user._id);
    expect(fresh.plan).toBe('premium');
    const sub = await Subscription.findOne({ userId: user._id });
    expect(sub.stripeSubscriptionId).toBe('sub_1');
    expect(sub.status).toBe('active');
    expect(sub.priceId).toBe('price_1');
  });

  it('customer.subscription.deleted downgrades user to free', async () => {
    const user = await createUser({ plan: 'premium' });
    await Subscription.create({
      userId: user._id, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1',
      status: 'active', currentPeriodEnd: new Date(),
    });
    stripeService.verifyWebhook.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'canceled' } },
    });
    const res = await request(app()).post('/billing/webhook')
      .set('stripe-signature', 'ok')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(res.status).toBe(200);
    const fresh = await User.findById(user._id);
    expect(fresh.plan).toBe('free');
  });
});
