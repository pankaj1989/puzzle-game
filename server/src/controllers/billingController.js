const env = require('../config/env');
const Pricing = require('../models/Pricing');
const stripeService = require('../services/stripeService');
const { HttpError } = require('../middleware/errorHandler');

async function checkout(req, res) {
  if (req.user.plan === 'premium') {
    throw new HttpError(409, 'Already premium', 'ALREADY_PREMIUM');
  }
  const pricing = await Pricing.getActive();
  if (!pricing) throw new HttpError(409, 'No active price configured', 'NO_ACTIVE_PRICE');

  const customer = await stripeService.ensureCustomer({ user: req.user });
  const { url } = await stripeService.createCheckoutSession({
    customer,
    priceId: pricing.stripePriceId,
    userId: req.user._id,
    successUrl: env.STRIPE_SUCCESS_URL,
    cancelUrl: env.STRIPE_CANCEL_URL,
  });
  res.json({ url });
}

module.exports = { checkout };
