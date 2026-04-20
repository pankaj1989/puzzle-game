const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const Subscription = require('../../src/models/Subscription');

registerHooks();

describe('Subscription model', () => {
  beforeAll(async () => {
    await Subscription.init();
  });

  it('creates with required fields', async () => {
    const s = await Subscription.create({
      userId: new mongoose.Types.ObjectId(),
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'active',
      currentPeriodEnd: new Date(),
    });
    expect(s.status).toBe('active');
  });

  it('enforces unique stripeSubscriptionId', async () => {
    const shared = {
      userId: new mongoose.Types.ObjectId(),
      stripeCustomerId: 'cus_1',
      status: 'active',
      currentPeriodEnd: new Date(),
    };
    await Subscription.create({ ...shared, stripeSubscriptionId: 'sub_X' });
    await expect(
      Subscription.create({
        userId: new mongoose.Types.ObjectId(),
        stripeCustomerId: 'cus_1',
        status: 'active',
        currentPeriodEnd: new Date(),
        stripeSubscriptionId: 'sub_X',
      })
    ).rejects.toThrow();
  });
});
