const env = require('../config/env');
const premium = require('../config/premium');
const User = require('../models/User');
const PremiumPurchase = require('../models/PremiumPurchase');
const stripeService = require('../services/stripeService');
const { HttpError } = require('../middleware/errorHandler');

async function createPaymentIntentHandler(req, res) {
  if (req.user.plan === 'premium') {
    throw new HttpError(409, 'Already premium', 'ALREADY_PREMIUM');
  }

  const customer = await stripeService.ensureCustomer({ user: req.user });
  const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent({
    amount: premium.amountCents,
    currency: premium.currency,
    customer,
    metadata: {
      userId: req.user._id.toString(),
    },
  });

  await PremiumPurchase.findOneAndUpdate(
    { userId: req.user._id },
    {
      $set: {
        userId: req.user._id,
        stripeCustomerId: customer,
        stripePaymentIntentId: paymentIntentId,
        status: 'pending',
        amountCents: premium.amountCents,
        currency: premium.currency,
        priceId: null,
        paidAt: null,
      },
    },
    { upsert: true, new: true }
  );

  res.json({
    clientSecret,
    paymentIntentId,
    amountCents: premium.amountCents,
    currency: premium.currency,
  });
}

async function confirmPayment(req, res) {
  const { paymentIntentId } = req.body;

  const purchase = await PremiumPurchase.findOne({ userId: req.user._id });
  if (!purchase || purchase.stripePaymentIntentId !== paymentIntentId) {
    throw new HttpError(404, 'Payment not found', 'PAYMENT_NOT_FOUND');
  }

  if (purchase.status === 'paid' && req.user.plan === 'premium') {
    return res.json({ success: true, user: req.user });
  }

  const result = await stripeService.verifyPaymentIntent(paymentIntentId);

  if (result.metadata.userId !== req.user._id.toString()) {
    throw new HttpError(403, 'Payment does not belong to this user', 'PAYMENT_MISMATCH');
  }

  if (!result.verified) {
    throw new HttpError(409, 'Payment not completed', 'PAYMENT_FAILED');
  }

  if (result.amount !== purchase.amountCents || result.currency !== purchase.currency) {
    throw new HttpError(409, 'Payment amount mismatch', 'PAYMENT_MISMATCH');
  }

  purchase.status = 'paid';
  purchase.paidAt = new Date();
  await purchase.save();

  req.user.plan = 'premium';
  await req.user.save();

  res.json({ success: true, user: req.user });
}

async function getPurchase(req, res) {
  const purchase = await PremiumPurchase.findOne({ userId: req.user._id });
  res.json({ purchase });
}

async function receipt(req, res) {
  const purchase = await PremiumPurchase.findOne({ userId: req.user._id, status: 'paid' });
  if (!purchase?.stripePaymentIntentId) {
    throw new HttpError(409, 'No payment found', 'NO_PAYMENT');
  }
  const url = await stripeService.getPaymentReceipt(purchase.stripePaymentIntentId);
  if (!url) throw new HttpError(404, 'Receipt not available', 'NO_RECEIPT');
  res.json({ url });
}

async function simulateSuccess(req, res) {
  if (env.NODE_ENV === 'production') {
    throw new HttpError(404, 'Not found', 'NOT_FOUND');
  }
  req.user.plan = 'premium';
  await req.user.save();
  res.json({ user: req.user, simulated: true });
}

module.exports = {
  createPaymentIntent: createPaymentIntentHandler,
  confirmPayment,
  getPurchase,
  receipt,
  simulateSuccess,
};
