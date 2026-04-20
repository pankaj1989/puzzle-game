const env = require('../config/env');
const Pricing = require('../models/Pricing');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
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

async function webhook(req, res) {
  const signature = req.headers['stripe-signature'] || '';
  let event;
  try {
    event = stripeService.verifyWebhook(req.body, signature);
  } catch {
    throw new HttpError(400, 'Invalid signature', 'INVALID_SIGNATURE');
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const customer = session.customer;
      const subscriptionId = session.subscription;
      if (!userId || !customer || !subscriptionId) break;

      const stripe = stripeService._stripeInstance;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = sub.items?.data?.[0]?.price?.id || null;

      await Subscription.findOneAndUpdate(
        { userId },
        {
          $set: {
            userId,
            stripeCustomerId: customer,
            stripeSubscriptionId: subscriptionId,
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
            priceId,
          },
        },
        { upsert: true, new: true }
      );

      await User.updateOne({ _id: userId }, { $set: { plan: 'premium' } });
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const record = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        {
          $set: {
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: !!sub.cancel_at_period_end,
          },
        },
        { new: true }
      );
      if (record) {
        const nowPremium = ['active', 'trialing'].includes(sub.status);
        await User.updateOne({ _id: record.userId }, { $set: { plan: nowPremium ? 'premium' : 'free' } });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const record = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { $set: { status: 'canceled' } },
        { new: true }
      );
      if (record) {
        await User.updateOne({ _id: record.userId }, { $set: { plan: 'free' } });
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
}

async function getSubscription(req, res) {
  const subscription = await Subscription.findOne({ userId: req.user._id });
  res.json({ subscription });
}

async function portal(req, res) {
  const sub = await Subscription.findOne({ userId: req.user._id });
  if (!sub?.stripeCustomerId) throw new HttpError(409, 'No Stripe customer', 'NO_CUSTOMER');
  const { url } = await stripeService.createPortalSession({
    customer: sub.stripeCustomerId,
    returnUrl: env.STRIPE_CANCEL_URL,
  });
  res.json({ url });
}

module.exports = { checkout, webhook, getSubscription, portal };
