const { registerHooks } = require('../testSetup');
const Pricing = require('../../src/models/Pricing');

registerHooks();

describe('Pricing model', () => {
  it('creates with required fields and defaults active=true', async () => {
    const p = await Pricing.create({
      stripePriceId: 'price_123', amountCents: 900, currency: 'usd', interval: 'month',
    });
    expect(p.active).toBe(true);
  });

  it('rejects invalid interval', async () => {
    await expect(Pricing.create({
      stripePriceId: 'price_123', amountCents: 900, currency: 'usd', interval: 'weekly',
    })).rejects.toThrow();
  });

  it('currency lowercased', async () => {
    const p = await Pricing.create({
      stripePriceId: 'price_123', amountCents: 900, currency: 'USD', interval: 'month',
    });
    expect(p.currency).toBe('usd');
  });
});
