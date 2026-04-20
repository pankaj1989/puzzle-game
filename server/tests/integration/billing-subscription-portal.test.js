jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Subscription = require('../../src/models/Subscription');

registerHooks();
const app = () => getApp();

describe('GET /billing/subscription', () => {
  it('null when no subscription', async () => {
    const user = await createUser();
    const res = await request(app()).get('/billing/subscription').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
  });

  it('returns the user subscription', async () => {
    const user = await createUser();
    await Subscription.create({
      userId: user._id, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1',
      status: 'active', currentPeriodEnd: new Date(Date.now() + 86400_000),
    });
    const res = await request(app()).get('/billing/subscription').set(authHeader(user));
    expect(res.body.subscription.status).toBe('active');
  });

  it('401 without auth', async () => {
    const res = await request(app()).get('/billing/subscription');
    expect(res.status).toBe(401);
  });
});

describe('POST /billing/portal', () => {
  beforeEach(() => {
    stripeService.createPortalSession.mockResolvedValue({ url: 'https://portal' });
  });

  it('409 when user has no Stripe customer yet', async () => {
    const user = await createUser();
    const res = await request(app()).post('/billing/portal').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_CUSTOMER');
  });

  it('returns portal url when customer exists', async () => {
    const user = await createUser();
    await Subscription.create({
      userId: user._id, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1',
      status: 'active', currentPeriodEnd: new Date(),
    });
    const res = await request(app()).post('/billing/portal').set(authHeader(user)).send({});
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://portal');
  });
});
