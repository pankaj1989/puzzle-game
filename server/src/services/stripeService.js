const Stripe = require('stripe');
const env = require('../config/env');
const Subscription = require('../models/Subscription');

const stripe = Stripe(env.STRIPE_SECRET_KEY);

async function ensureCustomer({ user }) {
  const existing = await Subscription.findOne({ userId: user._id });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;
  const cust = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user._id.toString() },
  });
  return cust.id;
}

async function createCheckoutSession({ customer, priceId, userId, successUrl, cancelUrl }) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: String(userId),
  });
  return { url: session.url, sessionId: session.id };
}

async function createPortalSession({ customer, returnUrl }) {
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: returnUrl,
  });
  return { url: session.url };
}

function verifyWebhook(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  verifyWebhook,
  ensureCustomer,
  _stripeInstance: stripe,
};
