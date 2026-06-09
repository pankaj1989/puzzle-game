jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const PremiumPurchase = require('../../src/models/PremiumPurchase');

registerHooks();
const app = () => getApp();

describe('GET /billing/purchase', () => {
  it('null when no purchase', async () => {
    const user = await createUser();
    const res = await request(app()).get('/billing/purchase').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.purchase).toBeNull();
  });

  it('returns the user purchase', async () => {
    const user = await createUser();
    await PremiumPurchase.create({
      userId: user._id,
      stripeCustomerId: 'cus_1',
      stripeCheckoutSessionId: 'cs_1',
      stripePaymentIntentId: 'pi_1',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    });
    const res = await request(app()).get('/billing/purchase').set(authHeader(user));
    expect(res.body.purchase.status).toBe('paid');
  });

  it('401 without auth', async () => {
    const res = await request(app()).get('/billing/purchase');
    expect(res.status).toBe(401);
  });
});

describe('POST /billing/receipt', () => {
  beforeEach(() => {
    stripeService.getPaymentReceiptUrl.mockResolvedValue('https://receipt');
  });

  it('409 when user has no payment yet', async () => {
    const user = await createUser();
    const res = await request(app()).post('/billing/receipt').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_PAYMENT');
  });

  it('returns receipt url when payment exists', async () => {
    const user = await createUser();
    await PremiumPurchase.create({
      userId: user._id,
      stripeCustomerId: 'cus_1',
      stripeCheckoutSessionId: 'cs_1',
      stripePaymentIntentId: 'pi_1',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    });
    const res = await request(app()).post('/billing/receipt').set(authHeader(user)).send({});
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://receipt');
    expect(stripeService.getPaymentReceiptUrl).toHaveBeenCalledWith('pi_1');
  });
});
