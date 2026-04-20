# Bumper Stumpers Backend

Node.js + Express + MongoDB API for the puzzle game.

## Setup

1. `cp .env.example .env` — fill in your secrets (see below)
2. Start a local MongoDB (Docker: `docker run -p 27017:27017 mongo:7`)
3. `npm install`
4. `npm run dev`

Server runs on `http://localhost:4000`.

## Environment Variables

See `.env.example` for the full list. Required:

- `MONGODB_URI` — mongo connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — ≥ 32 chars each (use different values)
- `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` / `SENDGRID_FROM_NAME` — for magic link emails
- `GOOGLE_CLIENT_ID` — Google OAuth Web client ID (from https://console.cloud.google.com)
- `MAGIC_LINK_REDIRECT_URL` — frontend URL where the magic-link token is verified (e.g. `http://localhost:5173/auth/magic`)

## Auth Endpoints

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
