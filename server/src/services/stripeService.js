const Stripe = require('stripe');
const env = require('../config/env');
const PremiumPurchase = require('../models/PremiumPurchase');

const stripe = Stripe(env.STRIPE_SECRET_KEY);

async function ensureCustomer({ user }) {
  const existing = await PremiumPurchase.findOne({ userId: user._id });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const cust = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user._id.toString() },
  });
  return cust.id;
}

async function createPaymentIntent({ amount, currency, customer, metadata }) {
  const pi = await stripe.paymentIntents.create({
    amount,
    currency,
    customer,
    metadata,
    automatic_payment_methods: { enabled: true },
  });
  return { clientSecret: pi.client_secret, paymentIntentId: pi.id };
}

async function verifyPaymentIntent(paymentIntentId) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    verified: pi.status === 'succeeded',
    status: pi.status,
    amount: pi.amount,
    currency: pi.currency,
    metadata: pi.metadata || {},
  };
}

async function getPaymentReceipt(paymentIntentId) {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  });
  const charge = pi.latest_charge;
  const receiptUrl = typeof charge === 'object' && charge ? charge.receipt_url : null;
  return receiptUrl || null;
}

module.exports = {
  createPaymentIntent,
  verifyPaymentIntent,
  getPaymentReceipt,
  getPaymentReceiptUrl: getPaymentReceipt,
  ensureCustomer,
  _stripeInstance: stripe,
};
