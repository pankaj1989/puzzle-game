# Bumper Stumpers Backend

Node.js + Express + MongoDB API for the puzzle game.

## Setup

1. `cp .env.example .env` — fill in your secrets (see below)
2. Start a local MongoDB (Docker: `docker run -p 27017:27017 mongo:7`)
3. `npm install`
4. `npm run dev`
5. `npm run seed` — load starter categories + puzzles into your local MongoDB

Server runs on `http://localhost:4000`.

## Full-stack local dev

Run all three pieces in separate terminals:

```bash
# Terminal 1 — MongoDB (via brew)
brew services start mongodb-community

# Terminal 2 — Backend
cd server && npm run dev       # http://localhost:4000

# Terminal 3 — Frontend
npm run dev                    # http://localhost:5173
```

Seed data once (idempotent upsert):
```bash
cd server && npm run seed
```

Env files:
- `server/.env` — backend secrets (copy from `server/.env.example`)
- `.env.local` — frontend (copy from `.env.local.example`)

In development, `/auth/magic/request` returns `devMagicLinkUrl` in its response so you can test magic-link sign-in without SendGrid. The login page renders the dev link inline.

## Environment Variables

See `.env.example` for the full list. Required:

- `MONGODB_URI` — mongo connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — ≥ 32 chars each (use different values)
- `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` / `SENDGRID_FROM_NAME` — for magic link emails
- `GOOGLE_CLIENT_ID` — Google OAuth Web client ID (from https://console.cloud.google.com)
- `MAGIC_LINK_REDIRECT_URL` — frontend URL where the magic-link token is verified (e.g. `http://localhost:5173/auth/magic`)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — from https://dashboard.stripe.com/test/apikeys and `stripe listen` output
- `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` — where Stripe redirects after Checkout
- `ADMIN_EMAILS` — comma-separated; matching users are auto-promoted to admin on sign-in

## API Endpoints

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | /auth/signup | — | `{ email, password, displayName? }` | Create account (email/password) |
| POST | /auth/login | — | `{ email, password }` | Login with email/password |
| POST | /auth/refresh | — | `{ refreshToken }` | Rotate refresh token, get new access |
| POST | /auth/logout | — | `{ refreshToken }` | Revoke refresh token |
| POST | /auth/magic/request | — | `{ email }` | Email a one-time sign-in link |
| POST | /auth/magic/verify | — | `{ token }` | Verify magic link token, return session |
| POST | /auth/google | — | `{ idToken }` | Sign in with Google ID token |
| GET | /auth/me | Bearer | — | Current user |
| GET | /profile | Bearer | — | Get profile |
| PATCH | /profile | Bearer | `{ displayName? }` | Update profile |
| GET | /categories | — | — | List all categories |
| POST | /sessions/start | Bearer | `{ categorySlug? }` | Start a new session; free users may not pass categorySlug |
| POST | /sessions/:id/hint | Bearer | — | Request next hint (penalty applied at scoring) |
| POST | /sessions/:id/guess | Bearer | `{ guess }` | Submit answer; server scores and finalizes |
| GET | /sessions/me | Bearer | — | Paginated list of your sessions |
| GET | /sessions/:id | Bearer | — | Single session detail (must be yours) |
| GET | /sessions/:id/share | Bearer | — | Shareable result text |
| GET | /leaderboards/day | — | — | Daily leaderboard |
| GET | /leaderboards/week | — | — | Weekly leaderboard |
| GET | /leaderboards/all | — | — | All-time leaderboard |
| GET | /leaderboards/me | Bearer | `?window=day\|week\|all` | Your rank + score |
| GET | /pricing | — | — | Current active price (or null) |
| POST | /admin/pricing | Bearer + admin | `{ stripePriceId, amountCents, currency, interval }` | Upsert pricing (deactivates prior) |
| POST | /billing/checkout | Bearer | — | Stripe Checkout session URL |
| POST | /billing/webhook | Stripe sig | raw JSON | Stripe event handler |
| GET | /billing/subscription | Bearer | — | User's current subscription (or null) |
| POST | /billing/portal | Bearer | — | Stripe Customer Portal session URL |

All protected endpoints require `Authorization: Bearer <accessToken>`.

## Response Format

**Success (auth-returning endpoints):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "hex...",
  "user": { "id": "...", "email": "...", "role": "user", "plan": "free", ... }
}
```

**Errors:**
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Missing token" } }
```

## Scoring

Score is calculated server-side when a session is completed with a correct guess:

```
score = basePoints × timeBonus × difficultyMult × hintPenalty × wrongGuessPenalty
```

- `timeBonus` = max(0.1, 1 − elapsed / timeLimit)
- `difficultyMult` = easy 1.0, medium 1.5, hard 2.0
- `hintPenalty` = max(0.1, 1 − hintsUsed × 0.15)
- `wrongGuessPenalty` = max(0.3, 1 − wrongGuesses × 0.1)

Rounded to integer, never negative.

## Billing (Stripe)

1. Grab test keys at https://dashboard.stripe.com/test/apikeys. Put them in `server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...  # from `stripe listen` output below
   ```

2. Create a Product + Price in Stripe dashboard (Test mode). Copy the Price ID (`price_...`).

3. Forward webhooks to your local backend (separate terminal):
   ```bash
   stripe listen --forward-to localhost:4000/billing/webhook
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` and restart the backend.

4. Promote yourself to admin — set `ADMIN_EMAILS=you@example.com` in `server/.env`, sign out, sign back in. Your role flips to `admin` automatically.

5. Configure pricing via API (`$TOKEN` = your admin access token):
   ```bash
   curl -X POST http://localhost:4000/admin/pricing \
     -H "Authorization: Bearer $TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"stripePriceId":"price_xxx","amountCents":900,"currency":"usd","interval":"month"}'
   ```

6. Click "Upgrade to Premium" in the app. Use Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). After confirmation the webhook flips your plan to `premium`.

7. Cancel via Stripe Customer Portal (linked from `/game-start` for premium users).

## Admin panel

Any user whose email is in `ADMIN_EMAILS` is auto-promoted to `admin` role on sign-in. Once signed in as admin, visit http://localhost:5173/admin to:

- **Dashboard** — aggregate user/puzzle/session/subscription counts
- **Puzzles** — full CRUD, paginated
- **Categories** — full CRUD (can't delete categories with puzzles)
- **Users** — search by email, toggle role (user/admin) and plan (free/premium) inline
- **Pricing** — upsert the active Stripe price (replaces the curl workflow)

Non-admin users hitting `/admin` are redirected back to `/game-start`.

## Leaderboards + Streaks

Users accumulate a daily `currentStreak` (consecutive UTC days with at least one solved puzzle). Missing a day resets the streak to 1 on next solve. `longestStreak` never decreases. `totalScore` is denormalized on the User document and incremented on every solved session.

Public endpoints (no auth):
- `GET /leaderboards/day` — sum of session scores completed today (UTC)
- `GET /leaderboards/week` — sum from the last 7 days
- `GET /leaderboards/all` — ranked by `User.totalScore`

Authed endpoints:
- `GET /leaderboards/me?window=day|week|all` — your rank and score (`rank` is `null` if score is 0)

Sharing:
- `GET /sessions/:id/share` — returns a short emoji-grid text block; the frontend lets the user copy it to clipboard.

## Ads

Google AdSense renders to **free users only**. Premium users see no ad slots.

1. Get approved at https://www.google.com/adsense/
2. Put your publisher id in `.env.local` (frontend):
   ```
   VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
   ```
3. Create ad units in the AdSense dashboard and replace the placeholder slot IDs (`1234567890`, `9876543210`) in `src/pages/GameStart.jsx` and `src/pages/GamePlay.jsx` with your real slot IDs.
4. Redeploy. Wait for Google to start serving ads (can take several hours after approval).

## Google Sign-In

Backend endpoint `POST /auth/google` accepts `{ idToken }` (Plan 1). Frontend now renders a **Sign in with Google** button on both `/login` and `/signup`.

1. Create an OAuth Web Client at https://console.cloud.google.com/apis/credentials
2. Put the client id in BOTH:
   - `server/.env`: `GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com`
   - `.env.local` (frontend): `VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com`
3. Add `http://localhost:5173` to the Authorized JavaScript origins in the Cloud Console.
4. Restart both dev servers.

## Plan Gating

- **Free plan:** `POST /sessions/start` with no body → random non-premium puzzle. Passing `categorySlug` returns 403 `PLAN_REQUIRED`.
- **Premium plan:** `POST /sessions/start` with or without `categorySlug` → any puzzle (premium + non-premium).

## Testing

`npm test` — full integration suite against in-memory MongoDB (`mongodb-memory-server`).

## Tech Stack

- Node.js ≥ 20, Express 5, Mongoose 9
- Auth: `bcrypt`, `jsonwebtoken`, `google-auth-library`
- Validation: `zod`
- Email: `@sendgrid/mail`
- Security: `helmet`, `cors`, `express-rate-limit`

## Directory Structure

```
src/
  config/       env loader + mongo connection
  models/       mongoose schemas (User, RefreshToken, MagicLinkToken)
  services/     bcrypt, jwt, google, sendgrid wrappers
  middleware/   async handler, error handler, validate, authRequired, rate limit
  validators/   zod schemas for endpoint bodies
  controllers/  auth + profile request handlers
  routes/       /auth and /profile routers
  app.js        express app factory
  index.js      process entry: connect DB, start server
tests/
  integration/  endpoint + service tests
  helpers.js    getApp, createUser, authHeader
  testSetup.js  DB lifecycle helpers
```
