const { z } = require('zod');

const upsertPricingSchema = z.object({
  stripePriceId: z.string().min(1).max(100),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3),
  interval: z.enum(['month', 'year']),
}).strict();

module.exports = { upsertPricingSchema };
