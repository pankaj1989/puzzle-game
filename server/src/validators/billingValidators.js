const { z } = require('zod');

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
}).strict();

module.exports = { confirmPaymentSchema };
