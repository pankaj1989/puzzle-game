# Stripe Subscriptions + Admin Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe subscription billing (monthly, single price) with an admin-configurable price stored in MongoDB. Premium users automatically get full access (already enforced by Plan 2's plan-gate middleware). Admin users are bootstrapped via `ADMIN_EMAILS` env var. Cancel flow uses Stripe Customer Portal.

**Architecture:** Backend adds a `Pricing` singleton and a `Subscription` model. Users upgrade via `POST /billing/checkout` which creates a Stripe Checkout Session and returns a redirect URL. Stripe notifies us via `POST /billing/webhook`; we verify the signature with the raw request body, then update `User.plan` + `Subscription` rows. Cancel goes through Stripe Customer Portal. Admin endpoints (`POST /admin/pricing`) are gated by the existing `authRequired({ roles: ['admin'] })` middleware. Admin promotion happens automatically when a user with an email in `ADMIN_EMAILS` signs in through any of the four auth paths.

**Tech Stack:**
- New runtime dep: `stripe` (official SDK)
- No new frontend deps — uses existing API client + `window.location` redirects
- Testing: Jest + Supertest with `stripe` SDK mocked via `jest.mock`

---

## File Structure

```
server/
├── package.json                                 # MODIFY: add stripe dep + npm scripts already exist
├── .env.example                                 # MODIFY: STRIPE_* + ADMIN_EMAILS
├── src/
│   ├── config/env.js                            # MODIFY: add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAILS
│   ├── models/
│   │   ├── Pricing.js                           # NEW: singleton doc with stripePriceId, amount, currency, interval, active
│   │   └── Subscription.js                      # NEW: per-user Stripe subscription mirror
│   ├── services/
│   │   ├── stripeService.js                     # NEW: thin wrapper around stripe SDK (checkout, portal, webhook verify)
│   │   └── adminPromoter.js                     # NEW: promoteIfAdminEmail(user) helper
│   ├── middleware/
│   │   └── (no changes needed)                  # authRequired already supports { roles: ['admin'] }
│   ├── validators/
│   │   └── billingValidators.js                 # NEW: pricing + checkout zod schemas
│   ├── controllers/
│   │   ├── authController.js                    # MODIFY: call promoteIfAdminEmail after every successful auth
│   │   ├── pricingController.js                 # NEW: list + upsert pricing
│   │   └── billingController.js                 # NEW: checkout, portal, subscription, webhook
│   └── routes/
│       ├── pricing.js                           # NEW: GET /pricing, POST /admin/pricing
│       └── billing.js                           # NEW: POST /billing/checkout, /billing/webhook, GET /billing/subscription, POST /billing/portal
├── src/app.js                                   # MODIFY: mount /pricing + /billing, carve out raw body for webhook
└── tests/
    └── integration/
        ├── pricing-model.test.js                # NEW
        ├── subscription-model.test.js           # NEW
        ├── stripe-service.test.js               # NEW (with SDK mock)
        ├── admin-promoter.test.js               # NEW
        ├── pricing-endpoints.test.js            # NEW: GET + POST /pricing + admin gate
        ├── billing-checkout.test.js             # NEW
        ├── billing-webhook.test.js              # NEW: event handling + sig verification
        └── billing-subscription-portal.test.js  # NEW

/                                                 # (frontend, repo root)
└── src/
    ├── components/common/PremiumAdModal.jsx     # MODIFY: "Upgrade to Premium" calls /billing/checkout, redirects
    ├── pages/
    │   ├── GameStart.jsx                        # MODIFY: locked category click opens modal; subscription status + "Manage" button for premium users
    │   └── BillingSuccessPage.jsx               # NEW: lands here after Stripe checkout, refreshes /auth/me
    └── App.jsx                                  # MODIFY: add /billing/success route
```

**Notes:**
- Pricing is a **singleton** (one active doc). The schema allows multiple rows for history, but only the most recent `active: true` row is used.
- Stripe webhook endpoint needs the **raw body** for signature verification. We carve it out in `app.js` by mounting `express.raw()` on `/billing/webhook` BEFORE the global `express.json()` parser.
- Admin UI is out of scope. Admins use curl/Postman for pricing CRUD until Plan 5.

---

## API Contracts

All dollar amounts are in cents.

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | /pricing | — | — | `{ pricing: { amountCents, currency, interval, stripePriceId } }` or `{ pricing: null }` |
| POST | /admin/pricing | Bearer + admin | `{ stripePriceId, amountCents, currency, interval }` | `{ pricing }` |
| POST | /billing/checkout | Bearer | — | `{ url }` |
| POST | /billing/webhook | Stripe sig | raw JSON | `{ received: true }` |
| GET | /billing/subscription | Bearer | — | `{ subscription }` or `{ subscription: null }` |
| POST | /billing/portal | Bearer | — | `{ url }` |

**Webhook events handled:**
- `checkout.session.completed` — mark user premium, store subscription
- `customer.subscription.updated` — sync status + period end
- `customer.subscription.deleted` — downgrade user to free

---

## Conventions

- All `Run:` commands from `server/` unless stated.
- TDD for all backend tasks.
- Frontend tasks have manual verification (no frontend test infra).
- 1 commit per task.

---

## Task 1: Install Stripe SDK + env vars

**Files:**
- Modify: `server/package.json` (install stripe)
- Modify: `server/.env.example`
- Modify: `server/.env` (dev values — gitignored)
- Modify: `server/src/config/env.js`
- Modify: `server/tests/env.js`

- [ ] **Step 1: Install Stripe**

Run from `server/`:
```bash
npm install stripe
```

- [ ] **Step 2: Update `server/.env.example`**

Append at the bottom:
```
# Stripe (test keys from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
# Success + cancel URLs returned to after Stripe Checkout.
STRIPE_SUCCESS_URL=http://localhost:5173/billing/success
STRIPE_CANCEL_URL=http://localhost:5173/game-start

# Comma-separated emails that are auto-promoted to admin on sign-in.
ADMIN_EMAILS=
```

- [ ] **Step 3: Update local `server/.env`** (gitignored)

Append the same 6 lines with dev-appropriate defaults. Use placeholder keys; user will swap in real ones.

- [ ] **Step 4: Extend env loader — `server/src/config/env.js`**

Inside the zod schema object, add:
```js
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url(),
  STRIPE_CANCEL_URL: z.string().url(),
  ADMIN_EMAILS: z.string().default('').transform(s =>
    s.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  ),
```

- [ ] **Step 5: Update `server/tests/env.js`**

Append:
```js
process.env.STRIPE_SECRET_KEY = 'sk_test_test';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.STRIPE_SUCCESS_URL = 'http://localhost:5173/billing/success';
process.env.STRIPE_CANCEL_URL = 'http://localhost:5173/game-start';
process.env.ADMIN_EMAILS = 'admin@test.com';
```

- [ ] **Step 6: Run tests**

`cd server && npm test` — expect **97 passing** (still green; no new behavior yet but env loader change is validated).

- [ ] **Step 7: Commit**

```bash
git add server/package.json server/package-lock.json server/.env.example server/src/config/env.js server/tests/env.js
git commit -m "chore(server): add Stripe SDK and related env vars"
```

---

## Task 2: Pricing model (singleton)

**Files:**
- Create: `server/src/models/Pricing.js`
- Create: `server/tests/integration/pricing-model.test.js`

- [ ] **Step 1: Write failing test**

```js
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
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `server/src/models/Pricing.js`**

```js
const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  stripePriceId: { type: String, required: true, trim: true, index: true },
  amountCents: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 3 },
  interval: { type: String, enum: ['month', 'year'], required: true },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

pricingSchema.statics.getActive = function () {
  return this.findOne({ active: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Pricing', pricingSchema);
```

- [ ] **Step 4: Run — expect PASS (3/3)**

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Pricing.js server/tests/integration/pricing-model.test.js
git commit -m "feat(server): add Pricing model (singleton active)"
```

---

## Task 3: Subscription model

**Files:**
- Create: `server/src/models/Subscription.js`
- Create: `server/tests/integration/subscription-model.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const Subscription = require('../../src/models/Subscription');

registerHooks();

describe('Subscription model', () => {
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
    const shared = { userId: new mongoose.Types.ObjectId(), stripeCustomerId: 'cus_1', status: 'active', currentPeriodEnd: new Date() };
    await Subscription.create({ ...shared, stripeSubscriptionId: 'sub_X' });
    await expect(Subscription.create({ ...shared, stripeSubscriptionId: 'sub_X' })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `server/src/models/Subscription.js`**

```js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
  stripeCustomerId: { type: String, required: true, index: true },
  stripeSubscriptionId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'],
    required: true,
  },
  currentPeriodEnd: { type: Date, required: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  priceId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
```

- [ ] **Step 4: Run — expect PASS (2/2)**

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Subscription.js server/tests/integration/subscription-model.test.js
git commit -m "feat(server): add Subscription model"
```

---

## Task 4: Stripe service wrapper

**Files:**
- Create: `server/src/services/stripeService.js`
- Create: `server/tests/integration/stripe-service.test.js`

The service wraps the Stripe SDK so controllers are thin and testable. We expose:
- `createCheckoutSession({ customer, priceId, userId, successUrl, cancelUrl })` — returns `{ url, sessionId }`
- `createPortalSession({ customer, returnUrl })` — returns `{ url }`
- `verifyWebhook(rawBody, signature)` — returns Stripe event object (throws on invalid sig)
- `ensureCustomer({ user })` — reuses existing customer id or creates one, returns customer id

- [ ] **Step 1: Write failing test**

```js
jest.mock('stripe', () => {
  const mock = {
    checkout: { sessions: { create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
    customers: { create: jest.fn(), list: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  };
  return jest.fn(() => mock);
});

const stripeSdk = require('stripe');
const {
  createCheckoutSession,
  createPortalSession,
  verifyWebhook,
  ensureCustomer,
  _stripeInstance,
} = require('../../src/services/stripeService');

describe('stripeService', () => {
  const stripe = stripeSdk();

  it('creates a checkout session with expected params', async () => {
    stripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout', id: 'cs_1' });
    const out = await createCheckoutSession({
      customer: 'cus_1', priceId: 'price_1', userId: 'u1',
      successUrl: 'http://s', cancelUrl: 'http://c',
    });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'subscription',
      customer: 'cus_1',
      line_items: [{ price: 'price_1', quantity: 1 }],
      success_url: 'http://s',
      cancel_url: 'http://c',
      client_reference_id: 'u1',
    }));
    expect(out).toEqual({ url: 'https://checkout', sessionId: 'cs_1' });
  });

  it('creates portal session', async () => {
    stripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://portal' });
    const out = await createPortalSession({ customer: 'cus_1', returnUrl: 'http://r' });
    expect(out).toEqual({ url: 'https://portal' });
  });

  it('verifies webhook passes raw body and signature', () => {
    stripe.webhooks.constructEvent.mockReturnValue({ type: 'x' });
    const ev = verifyWebhook(Buffer.from('{}'), 'sig123');
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(Buffer.from('{}'), 'sig123', expect.any(String));
    expect(ev).toEqual({ type: 'x' });
  });

  it('ensureCustomer reuses existing sub customer id', async () => {
    const Subscription = require('../../src/models/Subscription');
    const mongoose = require('mongoose');
    const userId = new mongoose.Types.ObjectId();
    await Subscription.create({
      userId, stripeCustomerId: 'cus_existing', stripeSubscriptionId: 'sub_X',
      status: 'active', currentPeriodEnd: new Date(),
    });
    const cid = await ensureCustomer({ user: { _id: userId, email: 'x@y.com' } });
    expect(cid).toBe('cus_existing');
    expect(stripe.customers.create).not.toHaveBeenCalled();
  });

  it('ensureCustomer creates one if no sub exists', async () => {
    stripe.customers.create.mockResolvedValue({ id: 'cus_new' });
    const mongoose = require('mongoose');
    const cid = await ensureCustomer({ user: { _id: new mongoose.Types.ObjectId(), email: 'x@y.com' } });
    expect(cid).toBe('cus_new');
    expect(stripe.customers.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'x@y.com' }));
  });
});

const { registerHooks } = require('../testSetup');
registerHooks();
```

- [ ] **Step 2: Run — expect FAIL (module missing)**

- [ ] **Step 3: Implement `server/src/services/stripeService.js`**

```js
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
```

- [ ] **Step 4: Run — expect PASS (5/5)**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/stripeService.js server/tests/integration/stripe-service.test.js
git commit -m "feat(server): Stripe service wrapper with webhook verify + customer cache"
```

---

## Task 5: Admin promoter + wire into auth

**Files:**
- Create: `server/src/services/adminPromoter.js`
- Modify: `server/src/controllers/authController.js` (call after every auth)
- Create: `server/tests/integration/admin-promoter.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const { promoteIfAdminEmail } = require('../../src/services/adminPromoter');
const User = require('../../src/models/User');

registerHooks();

describe('promoteIfAdminEmail', () => {
  it('promotes user whose email is in ADMIN_EMAILS', async () => {
    const user = await User.create({ email: 'admin@test.com', passwordHash: 'x', role: 'user' });
    await promoteIfAdminEmail(user);
    const fresh = await User.findById(user._id);
    expect(fresh.role).toBe('admin');
  });

  it('leaves non-admin emails untouched', async () => {
    const user = await User.create({ email: 'regular@test.com', passwordHash: 'x', role: 'user' });
    await promoteIfAdminEmail(user);
    const fresh = await User.findById(user._id);
    expect(fresh.role).toBe('user');
  });

  it('idempotent when user already admin', async () => {
    const user = await User.create({ email: 'admin@test.com', passwordHash: 'x', role: 'admin' });
    await promoteIfAdminEmail(user);
    const fresh = await User.findById(user._id);
    expect(fresh.role).toBe('admin');
  });
});
```

Note: `ADMIN_EMAILS=admin@test.com` is already set in `tests/env.js`.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `server/src/services/adminPromoter.js`**

```js
const env = require('../config/env');

async function promoteIfAdminEmail(user) {
  if (!user?.email) return;
  const list = env.ADMIN_EMAILS; // already an array via zod transform
  if (!list.includes(user.email.toLowerCase())) return;
  if (user.role === 'admin') return;
  user.role = 'admin';
  await user.save();
}

module.exports = { promoteIfAdminEmail };
```

- [ ] **Step 4: Wire into `server/src/controllers/authController.js`**

Add import at top:
```js
const { promoteIfAdminEmail } = require('../services/adminPromoter');
```

Call `await promoteIfAdminEmail(user)` AFTER the user is created/loaded but BEFORE signing tokens in each of these handlers: `signup`, `login`, `magicVerify`, `google`. (Do not add to `refresh` — user is already loaded from an existing session.)

For example in `signup`:
```js
const user = await User.create({ email, passwordHash, displayName });
await promoteIfAdminEmail(user);   // <-- add
const accessToken = signAccessToken(user);
```

Same pattern for the other three.

- [ ] **Step 5: Run — expect PASS (3/3 new)**

Full suite should still be green.

- [ ] **Step 6: Commit**

```bash
git add server/src/services/adminPromoter.js server/src/controllers/authController.js server/tests/integration/admin-promoter.test.js
git commit -m "feat(server): auto-promote users matching ADMIN_EMAILS on auth"
```

---

## Task 6: Pricing validators + controller + public GET /pricing + admin POST /admin/pricing

**Files:**
- Create: `server/src/validators/billingValidators.js`
- Create: `server/src/controllers/pricingController.js`
- Create: `server/src/routes/pricing.js`
- Modify: `server/src/app.js` (mount /pricing)
- Create: `server/tests/integration/pricing-endpoints.test.js`

- [ ] **Step 1: Write validators**

`server/src/validators/billingValidators.js`:
```js
const { z } = require('zod');

const upsertPricingSchema = z.object({
  stripePriceId: z.string().min(1).max(100),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3),
  interval: z.enum(['month', 'year']),
}).strict();

module.exports = { upsertPricingSchema };
```

- [ ] **Step 2: Write failing test**

`server/tests/integration/pricing-endpoints.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Pricing = require('../../src/models/Pricing');

registerHooks();
const app = () => getApp();

describe('GET /pricing', () => {
  it('returns null when nothing configured', async () => {
    const res = await request(app()).get('/pricing');
    expect(res.status).toBe(200);
    expect(res.body.pricing).toBeNull();
  });

  it('returns active pricing', async () => {
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    const res = await request(app()).get('/pricing');
    expect(res.body.pricing.amountCents).toBe(900);
    expect(res.body.pricing.interval).toBe('month');
  });
});

describe('POST /admin/pricing', () => {
  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'regular@test.com' });
    const res = await request(app()).post('/admin/pricing')
      .set(authHeader(user))
      .send({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    expect(res.status).toBe(403);
  });

  it('401 without token', async () => {
    const res = await request(app()).post('/admin/pricing').send({});
    expect(res.status).toBe(401);
  });

  it('creates pricing when admin', async () => {
    const admin = await createUser({ email: 'admin@test.com', role: 'admin' });
    const res = await request(app()).post('/admin/pricing')
      .set(authHeader(admin))
      .send({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    expect(res.status).toBe(201);
    expect(res.body.pricing.amountCents).toBe(900);
  });

  it('deactivates prior pricing when new row is created', async () => {
    const admin = await createUser({ email: 'admin@test.com', role: 'admin' });
    await request(app()).post('/admin/pricing').set(authHeader(admin))
      .send({ stripePriceId: 'price_old', amountCents: 500, currency: 'usd', interval: 'month' });
    await request(app()).post('/admin/pricing').set(authHeader(admin))
      .send({ stripePriceId: 'price_new', amountCents: 1200, currency: 'usd', interval: 'month' });
    const active = await Pricing.findOne({ active: true });
    expect(active.stripePriceId).toBe('price_new');
    const oldRow = await Pricing.findOne({ stripePriceId: 'price_old' });
    expect(oldRow.active).toBe(false);
  });
});
```

- [ ] **Step 3: Run — expect FAIL (404)**

- [ ] **Step 4: Implement controller — `server/src/controllers/pricingController.js`**

```js
const Pricing = require('../models/Pricing');

async function getActive(req, res) {
  const pricing = await Pricing.getActive();
  res.json({ pricing });
}

async function upsert(req, res) {
  const { stripePriceId, amountCents, currency, interval } = req.body;
  await Pricing.updateMany({ active: true }, { $set: { active: false } });
  const pricing = await Pricing.create({ stripePriceId, amountCents, currency, interval, active: true });
  res.status(201).json({ pricing });
}

module.exports = { getActive, upsert };
```

- [ ] **Step 5: Implement route — `server/src/routes/pricing.js`**

```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { upsertPricingSchema } = require('../validators/billingValidators');
const controller = require('../controllers/pricingController');

router.get('/pricing', asyncHandler(controller.getActive));
router.post(
  '/admin/pricing',
  authRequired({ roles: ['admin'] }),
  validate(upsertPricingSchema),
  asyncHandler(controller.upsert)
);

module.exports = router;
```

- [ ] **Step 6: Mount in `server/src/app.js`**

Add `const pricingRoutes = require('./routes/pricing');` near the other route imports. Mount BEFORE the 404 handler:
```js
app.use('/', pricingRoutes);
```
(Routes are already namespaced inside the router with absolute paths `/pricing` and `/admin/pricing`.)

- [ ] **Step 7: Run — expect PASS (5/5 new)**

- [ ] **Step 8: Commit**

```bash
git add server/src/validators/billingValidators.js server/src/controllers/pricingController.js server/src/routes/pricing.js server/src/app.js server/tests/integration/pricing-endpoints.test.js
git commit -m "feat(server): GET /pricing + POST /admin/pricing (singleton)"
```

---

## Task 7: POST /billing/checkout

**Files:**
- Create: `server/src/controllers/billingController.js`
- Create: `server/src/routes/billing.js`
- Modify: `server/src/app.js` (mount /billing + raw body for webhook)
- Create: `server/tests/integration/billing-checkout.test.js`

- [ ] **Step 1: Write failing test (with Stripe SDK mocked)**

```js
jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Pricing = require('../../src/models/Pricing');

registerHooks();
const app = () => getApp();

describe('POST /billing/checkout', () => {
  beforeEach(() => {
    stripeService.ensureCustomer.mockResolvedValue('cus_1');
    stripeService.createCheckoutSession.mockResolvedValue({ url: 'https://checkout', sessionId: 'cs_1' });
  });

  it('401 without token', async () => {
    const res = await request(app()).post('/billing/checkout').send({});
    expect(res.status).toBe(401);
  });

  it('409 when no active pricing configured', async () => {
    const user = await createUser();
    const res = await request(app()).post('/billing/checkout').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_ACTIVE_PRICE');
  });

  it('returns url for authed user with pricing set', async () => {
    const user = await createUser();
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    const res = await request(app()).post('/billing/checkout').set(authHeader(user)).send({});
    expect(res.status).toBe(200);
    expect(res.body.url).toBe('https://checkout');
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      customer: 'cus_1',
      priceId: 'price_1',
    }));
  });

  it('409 when user already premium', async () => {
    const user = await createUser({ plan: 'premium' });
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 900, currency: 'usd', interval: 'month' });
    const res = await request(app()).post('/billing/checkout').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_PREMIUM');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement controller — `server/src/controllers/billingController.js`**

```js
const env = require('../config/env');
const Pricing = require('../models/Pricing');
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

module.exports = { checkout };
```

- [ ] **Step 4: Implement route — `server/src/routes/billing.js`**

```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/billingController');

router.post('/checkout', authRequired(), asyncHandler(controller.checkout));

module.exports = router;
```

- [ ] **Step 5: Mount in `server/src/app.js`**

Add near other route imports:
```js
const billingRoutes = require('./routes/billing');
```

Mount `app.use('/billing', billingRoutes);` — but BEFORE mounting, carve out raw body for the webhook path that will be added in Task 8. Update app.js so that BEFORE `app.use(express.json(...))`:
```js
app.use('/billing/webhook', express.raw({ type: 'application/json' }));
```

And keep `app.use(express.json({ limit: '100kb' }));` as-is after. This ensures the webhook gets a raw buffer while every other endpoint still gets parsed JSON.

- [ ] **Step 6: Run — expect PASS (4/4 new)**

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/billingController.js server/src/routes/billing.js server/src/app.js server/tests/integration/billing-checkout.test.js
git commit -m "feat(server): POST /billing/checkout with pricing + customer reuse"
```

---

## Task 8: POST /billing/webhook

**Files:**
- Modify: `server/src/controllers/billingController.js` (add webhook handler)
- Modify: `server/src/routes/billing.js` (add route)
- Create: `server/tests/integration/billing-webhook.test.js`

The webhook handles three events:
- `checkout.session.completed` — mark user premium + upsert Subscription
- `customer.subscription.updated` — sync status + period end
- `customer.subscription.deleted` — downgrade to free

- [ ] **Step 1: Write failing test**

```js
jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const User = require('../../src/models/User');
const Subscription = require('../../src/models/Subscription');

registerHooks();
const app = () => getApp();

describe('POST /billing/webhook', () => {
  it('400 when signature invalid', async () => {
    stripeService.verifyWebhook.mockImplementation(() => { throw new Error('bad sig'); });
    const res = await request(app()).post('/billing/webhook')
      .set('stripe-signature', 'bad')
      .set('Content-Type', 'application/json')
      .send({ anything: true });
    expect(res.status).toBe(400);
  });

  it('checkout.session.completed promotes user and stores subscription', async () => {
    const user = await createUser({ email: 'pay@test.com' });
    stripeService.verifyWebhook.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: {
        id: 'cs_1',
        client_reference_id: user._id.toString(),
        customer: 'cus_1',
        subscription: 'sub_1',
      }},
    });
    stripeService._stripeInstance = {
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'sub_1',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
          items: { data: [{ price: { id: 'price_1' } }] },
          cancel_at_period_end: false,
        }),
      },
    };

    const res = await request(app()).post('/billing/webhook')
      .set('stripe-signature', 'ok')
      .set('Content-Type', 'application/json')
      .send({});
    expect(res.status).toBe(200);

    const fresh = await User.findById(user._id);
    expect(fresh.plan).toBe('premium');
    const sub = await Subscription.findOne({ userId: user._id });
    expect(sub.stripeSubscriptionId).toBe('sub_1');
    expect(sub.status).toBe('active');
  });

  it('customer.subscription.deleted downgrades user to free', async () => {
    const user = await createUser({ plan: 'premium' });
    await Subscription.create({
      userId: user._id, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1',
      status: 'active', currentPeriodEnd: new Date(),
    });
    stripeService.verifyWebhook.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_1', customer: 'cus_1', status: 'canceled' } },
    });
    await request(app()).post('/billing/webhook')
      .set('stripe-signature', 'ok').set('Content-Type', 'application/json').send({});
    const fresh = await User.findById(user._id);
    expect(fresh.plan).toBe('free');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Extend `server/src/controllers/billingController.js`**

Add imports at top (merge with existing):
```js
const User = require('../models/User');
```

Add handler:
```js
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

module.exports = { checkout, webhook };
```

- [ ] **Step 4: Wire route — `server/src/routes/billing.js`**

Append:
```js
router.post('/webhook', asyncHandler(controller.webhook));
```

No `authRequired` — Stripe itself authenticates via signature. No `validate` — body is a raw buffer.

- [ ] **Step 5: Run — expect PASS (3/3 new)**

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/billingController.js server/src/routes/billing.js server/tests/integration/billing-webhook.test.js
git commit -m "feat(server): POST /billing/webhook handles checkout + subscription events"
```

---

## Task 9: GET /billing/subscription + POST /billing/portal

**Files:**
- Modify: `server/src/controllers/billingController.js` (add getSubscription + portal handlers)
- Modify: `server/src/routes/billing.js` (add routes)
- Create: `server/tests/integration/billing-subscription-portal.test.js`

- [ ] **Step 1: Write failing test**

```js
jest.mock('../../src/services/stripeService');
const stripeService = require('../../src/services/stripeService');

const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Subscription = require('../../src/models/Subscription');

registerHooks();
const app = () => getApp();

describe('GET /billing/subscription', () => {
  it('null when no subscription', async () => {
    const user = await createUser();
    const res = await request(app()).get('/billing/subscription').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.subscription).toBeNull();
  });

  it('returns the user subscription', async () => {
    const user = await createUser();
    await Subscription.create({
      userId: user._id, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1',
      status: 'active', currentPeriodEnd: new Date(Date.now() + 86400_000),
    });
    const res = await request(app()).get('/billing/subscription').set(authHeader(user));
    expect(res.body.subscription.status).toBe('active');
  });

  it('401 without auth', async () => {
    const res = await request(app()).get('/billing/subscription');
    expect(res.status).toBe(401);
  });
});

describe('POST /billing/portal', () => {
  beforeEach(() => { stripeService.createPortalSession.mockResolvedValue({ url: 'https://portal' }); });

  it('409 when user has no Stripe customer yet', async () => {
    const user = await createUser();
    const res = await request(app()).post('/billing/portal').set(authHeader(user)).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_CUSTOMER');
  });

  it('returns portal url when customer exists', async () => {
    const user = await createUser();
    await Subscription.create({
      userId: user._id, stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1',
      status: 'active', currentPeriodEnd: new Date(),
    });
    const res = await request(app()).post('/billing/portal').set(authHeader(user)).send({});
    expect(res.body.url).toBe('https://portal');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add handlers to `server/src/controllers/billingController.js`**

```js
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
```

- [ ] **Step 4: Wire routes in `server/src/routes/billing.js`**

```js
router.get('/subscription', authRequired(), asyncHandler(controller.getSubscription));
router.post('/portal', authRequired(), asyncHandler(controller.portal));
```

- [ ] **Step 5: Run — expect PASS (5/5 new)**

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/billingController.js server/src/routes/billing.js server/tests/integration/billing-subscription-portal.test.js
git commit -m "feat(server): GET /billing/subscription + POST /billing/portal"
```

---

## Task 10: Frontend — wire PremiumAdModal to real checkout

**Files:**
- Modify: `src/components/common/PremiumAdModal.jsx`

- [ ] **Step 1: Read current PremiumAdModal**

Open `src/components/common/PremiumAdModal.jsx` to see its current shape (props: `isOpen`, `onClose`, `onUpgrade`).

- [ ] **Step 2: Wire "Upgrade to Premium" button**

Modify the button's click handler so it calls `/billing/checkout` and redirects to the returned URL:

Add at the top (merging with existing imports):
```jsx
import { useState } from 'react';
import { api } from '../../api/client';
```

In the component, add state + handler:
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

async function handleUpgrade() {
  setError(null);
  setLoading(true);
  try {
    const { url } = await api.post('/billing/checkout', {});
    window.location.href = url;
  } catch (err) {
    setError(err.message || 'Could not start checkout');
    setLoading(false);
  }
}
```

Replace the existing "Upgrade to Premium" button's `onClick` with `handleUpgrade`. Disable it while `loading`. Render `error` inline near the button if present.

- [ ] **Step 3: Manual verification**

Backend: ensure pricing is seeded. Run this one-off curl (as admin) after promoting yourself to admin via `ADMIN_EMAILS`:
```bash
# Promote yourself first: edit server/.env to include your email in ADMIN_EMAILS, then log in again.
# Then (replace TOKEN):
curl -X POST http://localhost:4000/admin/pricing \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"stripePriceId":"price_xxx","amountCents":900,"currency":"usd","interval":"month"}'
```
`price_xxx` comes from your Stripe dashboard → Products → Price → API ID.

In the browser, log in as any user, visit `/game`, click the "Premium" button in the header (or a locked category in `/game-start` — see next task). Expect redirect to Stripe's hosted checkout.

If STRIPE_SECRET_KEY is the placeholder, checkout will fail with a 401 from Stripe — expected until you set a real test key.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/PremiumAdModal.jsx
git commit -m "feat(frontend): PremiumAdModal Upgrade button hits /billing/checkout"
```

---

## Task 11: Frontend — locked category opens upsell modal

**Files:**
- Modify: `src/pages/GameStart.jsx`

- [ ] **Step 1: Add upsell modal state + handler**

At the top, import the modal:
```jsx
import { PremiumAdModal } from '../components/common/PremiumAdModal';
```

Add modal state:
```jsx
const [upsellOpen, setUpsellOpen] = useState(false);
```

- [ ] **Step 2: Change locked category click behavior**

Currently the locked card has `disabled={locked}`. Change to: when locked, open modal instead of being disabled.

Replace:
```jsx
<button
  key={cat._id || cat.id}
  onClick={() => !locked && startSession(cat.slug)}
  disabled={locked || starting}
  ...
>
```

With:
```jsx
<button
  key={cat._id || cat.id}
  onClick={() => {
    if (locked) setUpsellOpen(true);
    else startSession(cat.slug);
  }}
  disabled={starting}
  ...
>
```

- [ ] **Step 3: Render modal at end of JSX tree**

Before the closing `</div>` of the outer container, add:
```jsx
<PremiumAdModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />
```

- [ ] **Step 4: Manual verification**

As a free user, go to `/game-start` and click a locked premium category (Food / Animals / Random). The modal appears with "Upgrade to Premium". Click the upgrade button — redirects to Stripe checkout URL.

- [ ] **Step 5: Commit**

```bash
git add src/pages/GameStart.jsx
git commit -m "feat(frontend): locked categories open PremiumAdModal upsell"
```

---

## Task 12: Frontend — /billing/success page

**Files:**
- Create: `src/pages/BillingSuccessPage.jsx`
- Modify: `src/App.jsx` (add route)

- [ ] **Step 1: Create page**

`src/pages/BillingSuccessPage.jsx`:
```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export function BillingSuccessPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [plan, setPlan] = useState(user?.plan || 'free');

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    async function poll() {
      attempts += 1;
      try {
        const { user } = await api.get('/auth/me');
        setPlan(user.plan);
        if (user.plan === 'premium') {
          setStatus('premium');
          return;
        }
      } catch {
        // ignore transient errors
      }
      if (attempts < maxAttempts) {
        setTimeout(poll, 1500);
      } else {
        setStatus('timeout');
      }
    }
    poll();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white/90 rounded-2xl shadow-xl p-8 border border-card-gray2">
        {status === 'verifying' && (
          <>
            <h1 className="text-2xl font-serif text-navy mb-2">Confirming your upgrade…</h1>
            <p className="text-text-muted mb-6">Stripe is notifying us. This usually takes a few seconds.</p>
          </>
        )}
        {status === 'premium' && (
          <>
            <h1 className="text-3xl font-serif text-navy mb-2">You're Premium 🎉</h1>
            <p className="text-text-muted mb-6">All categories and puzzles are unlocked.</p>
            <Link to="/game-start" className="inline-block py-3 px-6 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange">
              Start playing
            </Link>
          </>
        )}
        {status === 'timeout' && (
          <>
            <h1 className="text-2xl font-serif text-navy mb-2">Still working on it</h1>
            <p className="text-text-muted mb-4">
              Payment looks successful but we haven't received confirmation yet. Your plan is <strong>{plan}</strong>.
              Refresh the page in a minute, or contact support.
            </p>
            <Link to="/game-start" className="text-brand-orange-dark underline">Back to game</Link>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Register route in `src/App.jsx`**

Add import:
```jsx
import { BillingSuccessPage } from './pages/BillingSuccessPage';
```

Add route (public — no ProtectedRoute, since Stripe's redirect preserves session but Checkout could arrive before hydration completes):
```jsx
<Route path="/billing/success" element={<BillingSuccessPage />} />
```

- [ ] **Step 3: Manual verification**

Directly visit `/billing/success`. Expect "Confirming your upgrade…" followed by either "premium" confirmation (after webhook fires) or "Still working on it" after ~15 seconds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BillingSuccessPage.jsx src/App.jsx
git commit -m "feat(frontend): /billing/success page polls /auth/me for plan flip"
```

---

## Task 13: Frontend — subscription status + "Manage" button on GameStart

**Files:**
- Modify: `src/pages/GameStart.jsx`

- [ ] **Step 1: Fetch subscription on mount**

Add state + effect near existing `categories` fetch:
```jsx
const [subscription, setSubscription] = useState(null);

useEffect(() => {
  let active = true;
  (async () => {
    try {
      const { subscription } = await api.get('/billing/subscription');
      if (active) setSubscription(subscription);
    } catch {
      /* ignore */
    }
  })();
  return () => { active = false; };
}, []);

async function openPortal() {
  try {
    const { url } = await api.post('/billing/portal', {});
    window.location.href = url;
  } catch (err) {
    alert(err.message || 'Could not open portal');
  }
}
```

- [ ] **Step 2: Render subscription block near the header**

Right after the existing `<header>` block, add:
```jsx
{subscription && (
  <div className="mb-6 p-4 border border-card-gray2 rounded-xl bg-white/70 flex flex-wrap items-center justify-between gap-3">
    <div>
      <div className="text-sm text-text-muted">Subscription</div>
      <div className="text-navy">
        <strong className="capitalize">{subscription.status}</strong>
        {subscription.cancelAtPeriodEnd && ' (cancels at period end)'}
        {' · renews '}
        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
      </div>
    </div>
    <button
      onClick={openPortal}
      className="py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
    >
      Manage subscription
    </button>
  </div>
)}
```

- [ ] **Step 3: Manual verification**

As a free user: the block is hidden (subscription null).
After upgrading (use Stripe's 4242 4242 4242 4242 test card): block appears with status "active" and a Manage button that redirects to Stripe Customer Portal.

- [ ] **Step 4: Commit**

```bash
git add src/pages/GameStart.jsx
git commit -m "feat(frontend): show subscription status + Manage link on /game-start"
```

---

## Task 14: README updates + full smoke

**Files:**
- Modify: `server/README.md`

- [ ] **Step 1: Append a "Billing (Stripe)" section to README**

```markdown
## Billing (Stripe)

1. Grab test keys at https://dashboard.stripe.com/test/apikeys. Put them in `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...  # from `stripe listen` output below
   ```

2. Create a Product + Price in Stripe dashboard (Test mode). Copy the Price ID (`price_...`).

3. Forward webhooks to your local backend (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:4000/billing/webhook
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` and restart the backend.

4. Promote yourself to admin — set `ADMIN_EMAILS` in `server/.env` then sign out and sign back in. Your role flips to `admin`.

5. Configure pricing via API (replace `$TOKEN` with your admin access token and `price_...` with yours):
   ```bash
   curl -X POST http://localhost:4000/admin/pricing \
     -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"stripePriceId":"price_xxx","amountCents":900,"currency":"usd","interval":"month"}'
   ```

6. Click "Upgrade to Premium" in the app. Use Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). After confirmation, the webhook flips your plan to `premium`.

Cancel via the Stripe Customer Portal (linked from `/game-start` for premium users).
```

- [ ] **Step 2: Run full backend test suite**

`cd server && npm test` — expect **all tests passing**. Rough count: 97 from Plan 3 + new:
- pricing-model (3) + subscription-model (2) + stripe-service (5) + admin-promoter (3) + pricing-endpoints (5) + billing-checkout (4) + billing-webhook (3) + billing-subscription-portal (5) = **30 new**
- Expect total around **127 passing**.

- [ ] **Step 3: Commit**

```bash
git add server/README.md
git commit -m "docs: Stripe billing setup + admin pricing instructions"
```

---

## Post-plan verification checklist

After all 14 tasks:

- [ ] `cd server && npm test` → all passing (~127 tests)
- [ ] Backend starts clean with dev `.env` containing placeholder Stripe keys
- [ ] `GET /pricing` returns `null` initially, then the admin-set price after `POST /admin/pricing`
- [ ] Non-admin gets 403 on `POST /admin/pricing`
- [ ] Adding your email to `ADMIN_EMAILS` + re-logging auto-promotes you
- [ ] With real Stripe test keys + webhook forwarder: complete a checkout with card `4242...`; user.plan flips to `premium`; `/game-start` shows subscription block; "Manage subscription" opens Stripe Portal
- [ ] Canceling in Portal triggers `customer.subscription.deleted`; webhook downgrades user to `free`
- [ ] `/billing/success` page polls and shows "You're Premium" after webhook lands

---

## Out of scope (for later plans)

- Admin UI (Plan 5)
- Billing history / invoices
- Multiple price tiers / annual billing / coupons
- Proration logic / upgrade-downgrade between tiers
- Leaderboards + ads + VPS deploy (Plan 6)
