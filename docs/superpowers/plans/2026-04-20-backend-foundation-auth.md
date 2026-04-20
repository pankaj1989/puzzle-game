# Backend Foundation + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a production-grade Node.js + Express + MongoDB backend with three authentication methods (email/password, magic link via SendGrid, Google OAuth ID-token), JWT access + refresh tokens, and `/auth/me` + profile update endpoints. Every endpoint covered by integration tests using Jest + Supertest against an in-memory MongoDB.

**Architecture:** Monorepo — existing Vite/React frontend stays at repo root; a new `/server` directory holds the Express API as an independent npm package. Layered structure: `routes → controllers → services → models`. JWT access tokens (15m, stateless) + refresh tokens (7d, stored hashed in MongoDB, rotated on use). Zod validates at the route boundary. Security: helmet, CORS allow-list, rate limiting, bcrypt password hashing.

**Tech Stack:**
- Runtime: Node.js ≥ 20 LTS
- Framework: Express 4
- Database: MongoDB + Mongoose 8
- Auth: `bcrypt`, `jsonwebtoken`, `google-auth-library`
- Email: `@sendgrid/mail`
- Validation: `zod`
- Security: `helmet`, `cors`, `express-rate-limit`
- Testing: `jest`, `supertest`, `mongodb-memory-server`
- Dev: `nodemon`, `dotenv`

---

## File Structure

```
server/
├── package.json
├── jest.config.js
├── .env.example
├── .gitignore
├── nodemon.json
├── README.md
├── src/
│   ├── index.js                      # process entry: connect DB, start server
│   ├── app.js                        # Express app factory (exported for tests)
│   ├── config/
│   │   ├── env.js                    # Zod-validated env loader
│   │   └── db.js                     # mongoose connection helper
│   ├── models/
│   │   ├── User.js                   # email, passwordHash, googleId, role, plan
│   │   ├── RefreshToken.js           # hashed token, userId, expiresAt
│   │   └── MagicLinkToken.js         # hashed token, email, expiresAt
│   ├── services/
│   │   ├── passwordService.js        # bcrypt wrapper
│   │   ├── tokenService.js           # JWT sign/verify + refresh rotation
│   │   ├── emailService.js           # SendGrid wrapper (mockable)
│   │   └── googleAuthService.js      # google-auth-library ID-token verify
│   ├── middleware/
│   │   ├── asyncHandler.js           # forwards async errors to error handler
│   │   ├── errorHandler.js           # centralized error formatter
│   │   ├── validate.js               # Zod schema → 400 on failure
│   │   ├── authRequired.js           # verifies JWT, attaches req.user
│   │   └── rateLimit.js              # per-IP limiter factory
│   ├── validators/
│   │   ├── authValidators.js
│   │   └── profileValidators.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── profileController.js
│   └── routes/
│       ├── auth.js
│       └── profile.js
└── tests/
    ├── env.js                        # pre-test env seeding (setupFiles)
    ├── globalSetup.js                # starts mongodb-memory-server once
    ├── globalTeardown.js             # stops mongodb-memory-server
    ├── testSetup.js                  # per-file: connect mongoose, afterEach cleanup
    ├── helpers.js                    # createUser, authHeader, etc.
    └── integration/
        ├── env.test.js
        ├── auth-signup.test.js
        ├── auth-login.test.js
        ├── auth-refresh.test.js
        ├── auth-logout.test.js
        ├── auth-magic-link.test.js
        ├── auth-google.test.js
        ├── auth-me.test.js
        └── profile.test.js
```

**Notes:**
- Frontend at repo root is **untouched** by this plan.
- No npm workspaces yet — backend has its own `package.json`.
- `server/.env` gitignored; `.env.example` documents all required variables.
- `testSetup.js` is `require`'d from the top of every integration test file (explicit pattern — avoids Jest config ambiguity).

---

## Conventions

- All `Run:` commands execute from `server/` unless stated.
- "Expected: PASS" = Jest reports 0 failures.
- Tests are written **before** implementation (TDD). Each task: write failing test → verify fail → implement → verify pass → commit.

---

## Task 1: Create `/server` directory and `package.json`

**Files:**
- Create: `server/package.json`
- Create: `server/.gitignore`

- [ ] **Step 1: Create folder skeleton**

From repo root:
```bash
mkdir -p server/src/{config,models,services,middleware,validators,controllers,routes} server/tests/integration
```

- [ ] **Step 2: Create `server/package.json`**

```json
{
  "name": "puzzle-game-server",
  "version": "0.1.0",
  "private": true,
  "description": "Backend API for Bumper Stumpers",
  "main": "src/index.js",
  "type": "commonjs",
  "engines": { "node": ">=20" },
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest --runInBand",
    "test:watch": "jest --watch --runInBand",
    "test:coverage": "jest --coverage --runInBand"
  }
}
```

- [ ] **Step 3: Create `server/.gitignore`**

```
node_modules/
.env
.env.local
coverage/
*.log
.DS_Store
```

- [ ] **Step 4: Commit**

```bash
git add server/
git commit -m "chore(server): initialize backend package"
```

---

## Task 2: Install dependencies

- [ ] **Step 1: Runtime deps**

Run from `server/`:
```bash
npm install express mongoose bcrypt jsonwebtoken zod helmet cors express-rate-limit cookie-parser @sendgrid/mail google-auth-library dotenv
```

- [ ] **Step 2: Dev deps**

```bash
npm install --save-dev jest supertest mongodb-memory-server nodemon
```

- [ ] **Step 3: Sanity check**

```bash
node -e "require('express'); require('mongoose'); console.log('ok')"
```
Expected: prints `ok`.

- [ ] **Step 4: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore(server): install runtime and dev dependencies"
```

---

## Task 3: Create `.env.example`

**Files:** Create: `server/.env.example`

- [ ] **Step 1: Write file**

```bash
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/bumper-stumpers

JWT_ACCESS_SECRET=replace-with-32+char-random-string
JWT_REFRESH_SECRET=replace-with-different-32+char-random-string
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

SENDGRID_API_KEY=SG.xxxxxxxx
SENDGRID_FROM_EMAIL=noreply@bumperstumpers.com
SENDGRID_FROM_NAME=Bumper Stumpers

GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com

MAGIC_LINK_TTL_MINUTES=15
MAGIC_LINK_REDIRECT_URL=http://localhost:5173/auth/magic
```

- [ ] **Step 2: Commit**

```bash
git add server/.env.example
git commit -m "docs(server): add env example"
```

---

## Task 4: Jest config + global test lifecycle

**Files:**
- Create: `server/jest.config.js`
- Create: `server/tests/env.js`
- Create: `server/tests/globalSetup.js`
- Create: `server/tests/globalTeardown.js`
- Create: `server/tests/testSetup.js`

- [ ] **Step 1: Create `server/jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 30000,
  clearMocks: true,
  verbose: true,
};
```

- [ ] **Step 2: Create `server/tests/env.js`**

```js
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.MONGODB_URI = 'mongodb://placeholder/test';
process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
process.env.JWT_REFRESH_SECRET = 'b'.repeat(40);
process.env.JWT_ACCESS_TTL = '15m';
process.env.JWT_REFRESH_TTL = '7d';
process.env.SENDGRID_API_KEY = 'SG.test';
process.env.SENDGRID_FROM_EMAIL = 'noreply@test.com';
process.env.SENDGRID_FROM_NAME = 'Test';
process.env.GOOGLE_CLIENT_ID = 'test.apps.googleusercontent.com';
process.env.MAGIC_LINK_TTL_MINUTES = '15';
process.env.MAGIC_LINK_REDIRECT_URL = 'http://localhost:5173/auth/magic';
```

- [ ] **Step 3: Create `server/tests/globalSetup.js`**

```js
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = mongod.getUri();
  // Also expose to child workers via env
  process.env.__MONGOD_URI__ = mongod.getUri();
};
```

- [ ] **Step 4: Create `server/tests/globalTeardown.js`**

```js
module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
};
```

- [ ] **Step 5: Create `server/tests/testSetup.js`**

Explicitly imported from each test file (no reliance on obscure Jest config keys).

```js
const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.__MONGOD_URI__ || process.env.MONGODB_URI;
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
}

function registerHooks() {
  beforeAll(connectDB);
  afterEach(clearDB);
  afterAll(disconnectDB);
}

module.exports = { connectDB, clearDB, disconnectDB, registerHooks };
```

- [ ] **Step 6: Commit**

```bash
git add server/jest.config.js server/tests/
git commit -m "test(server): set up jest + in-memory mongodb lifecycle"
```

---

## Task 5: Zod-validated env loader

**Files:**
- Create: `server/src/config/env.js`
- Create: `server/tests/integration/env.test.js`

- [ ] **Step 1: Write failing test**

Create `server/tests/integration/env.test.js`:
```js
describe('env loader', () => {
  const ORIGINAL = { ...process.env };
  afterEach(() => {
    process.env = { ...ORIGINAL };
    jest.resetModules();
  });

  it('returns parsed env with correct types', () => {
    const env = require('../../src/config/env');
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('test');
    expect(env.JWT_ACCESS_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it('throws when a required var is missing', () => {
    delete process.env.JWT_ACCESS_SECRET;
    jest.resetModules();
    expect(() => require('../../src/config/env')).toThrow(/JWT_ACCESS_SECRET/);
  });
});
```

- [ ] **Step 2: Run — verify fail**

```bash
npx jest tests/integration/env.test.js
```
Expected: FAIL — `Cannot find module '../../src/config/env'`.

- [ ] **Step 3: Implement `server/src/config/env.js`**

```js
require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.string().url(),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  SENDGRID_API_KEY: z.string().min(1),
  SENDGRID_FROM_EMAIL: z.string().email(),
  SENDGRID_FROM_NAME: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  MAGIC_LINK_REDIRECT_URL: z.string().url(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map(i => i.path.join('.')).join(', ');
  throw new Error(`Invalid or missing env vars: ${missing}`);
}
module.exports = parsed.data;
```

- [ ] **Step 4: Run — verify pass**

```bash
npx jest tests/integration/env.test.js
```
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add server/src/config/env.js server/tests/integration/env.test.js
git commit -m "feat(server): zod-validated env loader"
```

---

## Task 6: MongoDB connection helper

**Files:**
- Create: `server/src/config/db.js`

- [ ] **Step 1: Implement `server/src/config/db.js`**

```js
const mongoose = require('mongoose');
const env = require('./env');

async function connect() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  return mongoose.connection;
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };
```

- [ ] **Step 2: Commit**

```bash
git add server/src/config/db.js
git commit -m "feat(server): add mongoose connect/disconnect helper"
```

> No test — this is a thin wrapper verified transitively by every integration test that hits a model.

---

## Task 7: User model

**Files:**
- Create: `server/src/models/User.js`
- Create: `server/tests/integration/user-model.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/user-model.test.js`:
```js
const { registerHooks } = require('../testSetup');
const User = require('../../src/models/User');

registerHooks();

describe('User model', () => {
  it('creates a user with required fields', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    expect(user.email).toBe('a@b.com');
    expect(user.role).toBe('user');
    expect(user.plan).toBe('free');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('enforces unique email', async () => {
    await User.create({ email: 'a@b.com', passwordHash: 'x' });
    await expect(
      User.create({ email: 'a@b.com', passwordHash: 'y' })
    ).rejects.toThrow();
  });

  it('lowercases email on save', async () => {
    const user = await User.create({ email: 'MiXeD@B.Com', passwordHash: 'x' });
    expect(user.email).toBe('mixed@b.com');
  });
});
```

- [ ] **Step 2: Run — verify fail** (`Cannot find module '../../src/models/User'`)

- [ ] **Step 3: Implement `server/src/models/User.js`**

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null, index: true, sparse: true },
  displayName: { type: String, default: null, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  planExpiresAt: { type: Date, default: null },
  emailVerifiedAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
```

- [ ] **Step 4: Run — verify pass** (3/3)

- [ ] **Step 5: Commit**

```bash
git add server/src/models/User.js server/tests/integration/user-model.test.js
git commit -m "feat(server): add User model"
```

---

## Task 8: RefreshToken + MagicLinkToken models

**Files:**
- Create: `server/src/models/RefreshToken.js`
- Create: `server/src/models/MagicLinkToken.js`

- [ ] **Step 1: Implement `server/src/models/RefreshToken.js`**

```js
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', schema);
```

- [ ] **Step 2: Implement `server/src/models/MagicLinkToken.js`**

```js
const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('MagicLinkToken', schema);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/models/RefreshToken.js server/src/models/MagicLinkToken.js
git commit -m "feat(server): add refresh + magic link token models"
```

> Models are exercised by downstream auth integration tests — no isolated unit test here.

---

## Task 9: Password service (bcrypt wrapper)

**Files:**
- Create: `server/src/services/passwordService.js`
- Create: `server/tests/integration/password-service.test.js`

- [ ] **Step 1: Write failing test**

```js
const { hashPassword, verifyPassword } = require('../../src/services/passwordService');

describe('passwordService', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('hunter2');
    expect(hash).not.toBe('hunter2');
    expect(await verifyPassword('hunter2', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('hunter2');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `server/src/services/passwordService.js`**

```js
const bcrypt = require('bcrypt');
const ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS);
}
async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, verifyPassword };
```

- [ ] **Step 4: Run — verify pass**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/passwordService.js server/tests/integration/password-service.test.js
git commit -m "feat(server): add bcrypt password service"
```

---

## Task 10: Token service (JWT access + refresh rotation)

**Files:**
- Create: `server/src/services/tokenService.js`
- Create: `server/tests/integration/token-service.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const {
  signAccessToken, verifyAccessToken,
  issueRefreshToken, rotateRefreshToken, revokeRefreshToken,
} = require('../../src/services/tokenService');

registerHooks();

describe('tokenService', () => {
  it('signs and verifies access token', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    const token = signAccessToken(user);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(user._id.toString());
    expect(payload.role).toBe('user');
  });

  it('issues and rotates a refresh token', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    const { token } = await issueRefreshToken(user);
    const rotated = await rotateRefreshToken(token);
    expect(rotated.token).not.toBe(token);
    const old = await RefreshToken.findOne({});
    // old one should be revoked; new one should exist
    const all = await RefreshToken.find({});
    expect(all.some(t => t.revokedAt)).toBe(true);
  });

  it('rejects unknown refresh token', async () => {
    await expect(rotateRefreshToken('nope.nope.nope')).rejects.toThrow(/invalid/i);
  });

  it('revokes a refresh token', async () => {
    const user = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    const { token } = await issueRefreshToken(user);
    await revokeRefreshToken(token);
    await expect(rotateRefreshToken(token)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `server/src/services/tokenService.js`**

```js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, plan: user.plan },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function parseDurationToMs(str) {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) throw new Error(`Invalid duration: ${str}`);
  const n = Number(m[1]);
  const mult = { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
  return n * mult;
}

async function issueRefreshToken(user) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_TTL));
  await RefreshToken.create({ userId: user._id, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

async function rotateRefreshToken(oldToken) {
  const existing = await RefreshToken.findOne({ tokenHash: hashToken(oldToken) });
  if (!existing) throw new Error('invalid refresh token');
  if (existing.revokedAt) throw new Error('invalid refresh token');
  if (existing.expiresAt < new Date()) throw new Error('invalid refresh token');
  existing.revokedAt = new Date();
  await existing.save();
  const User = require('../models/User');
  const user = await User.findById(existing.userId);
  if (!user) throw new Error('invalid refresh token');
  return issueRefreshToken(user);
}

async function revokeRefreshToken(token) {
  await RefreshToken.updateOne(
    { tokenHash: hashToken(token) },
    { $set: { revokedAt: new Date() } }
  );
}

async function revokeAllForUser(userId) {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = {
  signAccessToken, verifyAccessToken,
  issueRefreshToken, rotateRefreshToken, revokeRefreshToken,
  revokeAllForUser,
};
```

- [ ] **Step 4: Run — verify pass**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/tokenService.js server/tests/integration/token-service.test.js
git commit -m "feat(server): JWT access + rotating refresh token service"
```

---

## Task 11: Shared middleware (async handler, error handler, validate)

**Files:**
- Create: `server/src/middleware/asyncHandler.js`
- Create: `server/src/middleware/errorHandler.js`
- Create: `server/src/middleware/validate.js`

- [ ] **Step 1: Implement `server/src/middleware/asyncHandler.js`**

```js
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

- [ ] **Step 2: Implement `server/src/middleware/errorHandler.js`**

```js
const env = require('../config/env');

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
  }
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 && env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    },
  };
  if (env.NODE_ENV !== 'production' && status >= 500) {
    payload.error.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = { errorHandler, HttpError };
```

- [ ] **Step 3: Implement `server/src/middleware/validate.js`**

```js
const { HttpError } = require('./errorHandler');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR'));
  }
  req[source] = result.data;
  next();
};
```

- [ ] **Step 4: Commit**

```bash
git add server/src/middleware/
git commit -m "feat(server): add async handler, error handler, and validate middleware"
```

---

## Task 12: Auth-required middleware

**Files:**
- Create: `server/src/middleware/authRequired.js`

- [ ] **Step 1: Implement**

```js
const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');
const { HttpError } = require('./errorHandler');

function extractToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

module.exports = function authRequired(options = {}) {
  const { roles } = options;
  return async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next(new HttpError(401, 'Missing token', 'UNAUTHORIZED'));
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new HttpError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
    }
    const user = await User.findById(payload.sub);
    if (!user) return next(new HttpError(401, 'User not found', 'UNAUTHORIZED'));
    if (roles && !roles.includes(user.role)) {
      return next(new HttpError(403, 'Forbidden', 'FORBIDDEN'));
    }
    req.user = user;
    next();
  };
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/middleware/authRequired.js
git commit -m "feat(server): add authRequired middleware with optional role gate"
```

> Tested transitively via protected-endpoint integration tests (Task 22, 25).

---

## Task 13: Rate limit middleware factory

**Files:** Create: `server/src/middleware/rateLimit.js`

- [ ] **Step 1: Implement**

```js
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function createLimiter({ windowMs, max, code = 'RATE_LIMITED' }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (req, res) => {
      res.status(429).json({ error: { code, message: 'Too many requests' } });
    },
  });
}

module.exports = {
  authLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  magicLinkLimiter: createLimiter({ windowMs: 60 * 60 * 1000, max: 5 }),
  generalLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 300 }),
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/middleware/rateLimit.js
git commit -m "feat(server): rate limit middleware factories"
```

---

## Task 14: Auth validators (Zod schemas)

**Files:** Create: `server/src/validators/authValidators.js`

- [ ] **Step 1: Implement**

```js
const { z } = require('zod');

const email = z.string().email().max(254).transform(s => s.toLowerCase().trim());
const password = z.string().min(8).max(128);

const signupSchema = z.object({
  email,
  password,
  displayName: z.string().min(1).max(60).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const magicLinkRequestSchema = z.object({ email });
const magicLinkVerifySchema = z.object({ token: z.string().min(1) });

const googleSchema = z.object({ idToken: z.string().min(1) });

module.exports = {
  signupSchema, loginSchema, refreshSchema,
  magicLinkRequestSchema, magicLinkVerifySchema, googleSchema,
};
```

- [ ] **Step 2: Commit**

```bash
git add server/src/validators/authValidators.js
git commit -m "feat(server): zod validators for auth endpoints"
```

---

## Task 15: Express app factory + index entry

**Files:**
- Create: `server/src/app.js`
- Create: `server/src/index.js`
- Create: `server/nodemon.json`

- [ ] **Step 1: Implement `server/src/app.js`**

```js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);

  app.use((req, res, next) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
```

- [ ] **Step 2: Implement `server/src/index.js`**

```js
const env = require('./config/env');
const { connect } = require('./config/db');
const { createApp } = require('./app');

async function start() {
  await connect();
  const app = createApp();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on :${env.PORT}`);
  });
}

start().catch(err => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error', err);
  process.exit(1);
});
```

- [ ] **Step 3: Implement `server/nodemon.json`**

```json
{ "watch": ["src"], "ext": "js,json", "ignore": ["tests"] }
```

**NOTE:** `server/src/routes/auth.js` and `server/src/routes/profile.js` are created in Tasks 16–23 and 25. Until those tasks are complete, `app.js` will throw on require — create stub files to unblock:

- [ ] **Step 4: Create stub routes**

`server/src/routes/auth.js`:
```js
const router = require('express').Router();
module.exports = router;
```

`server/src/routes/profile.js`:
```js
const router = require('express').Router();
module.exports = router;
```

- [ ] **Step 5: Smoke-test the app builds**

```bash
node -e "require('./src/app').createApp(); console.log('ok')"
```
Expected: `ok`.

- [ ] **Step 6: Commit**

```bash
git add server/src/app.js server/src/index.js server/nodemon.json server/src/routes/
git commit -m "feat(server): express app factory with helmet, cors, rate limit"
```

---

## Task 16: Test helpers

**Files:** Create: `server/tests/helpers.js`

- [ ] **Step 1: Implement**

```js
const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const { hashPassword } = require('../src/services/passwordService');
const { signAccessToken } = require('../src/services/tokenService');

let app;
function getApp() {
  if (!app) app = createApp();
  return app;
}

async function createUser({ email = 'test@b.com', password = 'password123', role = 'user', plan = 'free' } = {}) {
  const passwordHash = await hashPassword(password);
  return User.create({ email, passwordHash, role, plan });
}

function authHeader(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` };
}

module.exports = { getApp, request, createUser, authHeader };
```

- [ ] **Step 2: Commit**

```bash
git add server/tests/helpers.js
git commit -m "test(server): shared test helpers"
```

---

## Task 17: Signup endpoint

**Files:**
- Create/modify: `server/src/controllers/authController.js` (signup only)
- Create/modify: `server/src/routes/auth.js` (add POST /signup)
- Create: `server/tests/integration/auth-signup.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('POST /auth/signup', () => {
  it('creates a user and returns tokens', async () => {
    const res = await request(app()).post('/auth/signup')
      .send({ email: 'new@b.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe('new@b.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    const stored = await User.findOne({ email: 'new@b.com' });
    expect(stored).not.toBeNull();
  });

  it('rejects duplicate email', async () => {
    await request(app()).post('/auth/signup').send({ email: 'dup@b.com', password: 'password123' });
    const res = await request(app()).post('/auth/signup').send({ email: 'dup@b.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid input', async () => {
    const res = await request(app()).post('/auth/signup').send({ email: 'bad', password: '123' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Implement `server/src/controllers/authController.js`**

```js
const User = require('../models/User');
const { hashPassword } = require('../services/passwordService');
const { signAccessToken, issueRefreshToken } = require('../services/tokenService');
const { HttpError } = require('../middleware/errorHandler');

async function signup(req, res) {
  const { email, password, displayName } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, 'Email already registered', 'EMAIL_TAKEN');
  const passwordHash = await hashPassword(password);
  const user = await User.create({ email, passwordHash, displayName });
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.status(201).json({ accessToken, refreshToken, user });
}

module.exports = { signup };
```

- [ ] **Step 4: Wire route — `server/src/routes/auth.js`**

```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { signupSchema } = require('../validators/authValidators');
const authController = require('../controllers/authController');

router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));

module.exports = router;
```

- [ ] **Step 5: Run — verify pass**

```bash
npx jest tests/integration/auth-signup.test.js
```

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-signup.test.js
git commit -m "feat(server): POST /auth/signup"
```

---

## Task 18: Login endpoint

**Files:**
- Modify: `server/src/controllers/authController.js` (add login)
- Modify: `server/src/routes/auth.js` (add POST /login)
- Create: `server/tests/integration/auth-login.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
registerHooks();
const app = () => getApp();

describe('POST /auth/login', () => {
  it('returns tokens for valid credentials', async () => {
    await createUser({ email: 'x@b.com', password: 'password123' });
    const res = await request(app()).post('/auth/login')
      .send({ email: 'x@b.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    await createUser({ email: 'x@b.com', password: 'password123' });
    const res = await request(app()).post('/auth/login')
      .send({ email: 'x@b.com', password: 'wrong1234' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app()).post('/auth/login')
      .send({ email: 'no@b.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Add to controller**

Append to `server/src/controllers/authController.js`:
```js
const { verifyPassword } = require('../services/passwordService');

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.passwordHash) throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  user.lastLoginAt = new Date();
  await user.save();
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.json({ accessToken, refreshToken, user });
}

module.exports = { signup, login };
```

- [ ] **Step 4: Wire route**

Add to `server/src/routes/auth.js`:
```js
const { loginSchema } = require('../validators/authValidators');
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
```

- [ ] **Step 5: Run — verify pass**

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-login.test.js
git commit -m "feat(server): POST /auth/login"
```

---

## Task 19: Refresh token endpoint

**Files:**
- Modify controller + route
- Create: `server/tests/integration/auth-refresh.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const { issueRefreshToken } = require('../../src/services/tokenService');
registerHooks();
const app = () => getApp();

describe('POST /auth/refresh', () => {
  it('rotates refresh token and returns new access', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    const res = await request(app()).post('/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(token);
  });

  it('rejects invalid refresh', async () => {
    const res = await request(app()).post('/auth/refresh').send({ refreshToken: 'bogus' });
    expect(res.status).toBe(401);
  });

  it('rejects reused (now revoked) refresh', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    await request(app()).post('/auth/refresh').send({ refreshToken: token });
    const res = await request(app()).post('/auth/refresh').send({ refreshToken: token });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Add to controller**

```js
const { rotateRefreshToken } = require('../services/tokenService');

async function refresh(req, res) {
  const { refreshToken } = req.body;
  try {
    const { token: newRefresh } = await rotateRefreshToken(refreshToken);
    const existing = await User.findById(
      (await require('../models/RefreshToken').findOne({ tokenHash: require('crypto').createHash('sha256').update(newRefresh).digest('hex') })).userId
    );
    const accessToken = signAccessToken(existing);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch {
    throw new HttpError(401, 'Invalid refresh token', 'INVALID_REFRESH');
  }
}

module.exports = { signup, login, refresh };
```

> Note: the controller pulls the user by joining on the newly-issued token record to avoid exposing userId lookups from outside the service. If simpler: have `rotateRefreshToken` also return the user. Refactor if desired — both are correct.

- [ ] **Step 4: Wire route**

```js
const { refreshSchema } = require('../validators/authValidators');
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
```

- [ ] **Step 5: Run — verify pass; commit**

```bash
git add server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-refresh.test.js
git commit -m "feat(server): POST /auth/refresh with token rotation"
```

---

## Task 20: Logout endpoint

**Files:**
- Modify controller + route
- Create: `server/tests/integration/auth-logout.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const { issueRefreshToken } = require('../../src/services/tokenService');
registerHooks();
const app = () => getApp();

describe('POST /auth/logout', () => {
  it('revokes the refresh token', async () => {
    const user = await createUser();
    const { token } = await issueRefreshToken(user);
    const res = await request(app()).post('/auth/logout').send({ refreshToken: token });
    expect(res.status).toBe(204);
    const res2 = await request(app()).post('/auth/refresh').send({ refreshToken: token });
    expect(res2.status).toBe(401);
  });
});
```

- [ ] **Step 2: Add to controller**

```js
const { revokeRefreshToken } = require('../services/tokenService');

async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.status(204).end();
}

module.exports = { signup, login, refresh, logout };
```

- [ ] **Step 3: Route**

```js
router.post('/logout', validate(refreshSchema), asyncHandler(authController.logout));
```

- [ ] **Step 4: Run — verify pass; commit**

```bash
git add server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-logout.test.js
git commit -m "feat(server): POST /auth/logout"
```

---

## Task 21: Email service (SendGrid wrapper)

**Files:** Create: `server/src/services/emailService.js`

- [ ] **Step 1: Implement**

```js
const sgMail = require('@sendgrid/mail');
const env = require('../config/env');

if (env.NODE_ENV !== 'test') {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

async function sendEmail({ to, subject, html, text }) {
  if (env.NODE_ENV === 'test') {
    // No-op in tests; tests spy on this module directly.
    return { mocked: true };
  }
  return sgMail.send({
    to,
    from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
    subject, html, text,
  });
}

async function sendMagicLink(email, link) {
  return sendEmail({
    to: email,
    subject: 'Your Bumper Stumpers sign-in link',
    html: `<p>Click to sign in: <a href="${link}">${link}</a></p><p>This link expires in ${env.MAGIC_LINK_TTL_MINUTES} minutes.</p>`,
    text: `Sign in: ${link}\nExpires in ${env.MAGIC_LINK_TTL_MINUTES} minutes.`,
  });
}

module.exports = { sendEmail, sendMagicLink };
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/emailService.js
git commit -m "feat(server): SendGrid email service (mocked in tests)"
```

---

## Task 22: Magic link request + verify

**Files:**
- Modify controller + route
- Create: `server/tests/integration/auth-magic-link.test.js`

- [ ] **Step 1: Write failing test**

```js
jest.mock('../../src/services/emailService');

const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const emailService = require('../../src/services/emailService');
const MagicLinkToken = require('../../src/models/MagicLinkToken');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('magic link flow', () => {
  beforeEach(() => { emailService.sendMagicLink.mockResolvedValue({ ok: true }); });

  it('POST /auth/magic/request issues token and emails link', async () => {
    const res = await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    expect(res.status).toBe(202);
    expect(emailService.sendMagicLink).toHaveBeenCalledTimes(1);
    const link = emailService.sendMagicLink.mock.calls[0][1];
    expect(link).toMatch(/token=/);
  });

  it('POST /auth/magic/verify creates user (if new) and returns tokens', async () => {
    await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    const link = emailService.sendMagicLink.mock.calls[0][1];
    const token = new URL(link).searchParams.get('token');
    const res = await request(app()).post('/auth/magic/verify').send({ token });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const user = await User.findOne({ email: 'm@b.com' });
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it('rejects reused token', async () => {
    await request(app()).post('/auth/magic/request').send({ email: 'm@b.com' });
    const link = emailService.sendMagicLink.mock.calls[0][1];
    const token = new URL(link).searchParams.get('token');
    await request(app()).post('/auth/magic/verify').send({ token });
    const res = await request(app()).post('/auth/magic/verify').send({ token });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run — verify fail**

- [ ] **Step 3: Add to controller**

```js
const crypto = require('crypto');
const env = require('../config/env');
const MagicLinkToken = require('../models/MagicLinkToken');
const emailService = require('../services/emailService');

function hashSha(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function magicRequest(req, res) {
  const { email } = req.body;
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.MAGIC_LINK_TTL_MINUTES * 60 * 1000);
  await MagicLinkToken.create({ email, tokenHash: hashSha(token), expiresAt });
  const link = `${env.MAGIC_LINK_REDIRECT_URL}?token=${token}`;
  await emailService.sendMagicLink(email, link);
  res.status(202).json({ ok: true });
}

async function magicVerify(req, res) {
  const { token } = req.body;
  const record = await MagicLinkToken.findOne({ tokenHash: hashSha(token) });
  if (!record || record.consumedAt || record.expiresAt < new Date()) {
    throw new HttpError(401, 'Invalid or expired token', 'INVALID_MAGIC_TOKEN');
  }
  record.consumedAt = new Date();
  await record.save();
  let user = await User.findOne({ email: record.email });
  if (!user) {
    user = await User.create({ email: record.email, emailVerifiedAt: new Date() });
  } else if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    await user.save();
  }
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.json({ accessToken, refreshToken, user });
}

module.exports = { signup, login, refresh, logout, magicRequest, magicVerify };
```

- [ ] **Step 4: Routes**

```js
const { magicLinkRequestSchema, magicLinkVerifySchema } = require('../validators/authValidators');
const { magicLinkLimiter } = require('../middleware/rateLimit');

router.post('/magic/request', magicLinkLimiter, validate(magicLinkRequestSchema), asyncHandler(authController.magicRequest));
router.post('/magic/verify', validate(magicLinkVerifySchema), asyncHandler(authController.magicVerify));
```

- [ ] **Step 5: Run — verify pass; commit**

```bash
git add server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-magic-link.test.js
git commit -m "feat(server): magic link request + verify"
```

---

## Task 23: Google OAuth ID-token endpoint

**Files:**
- Create: `server/src/services/googleAuthService.js`
- Modify controller + route
- Create: `server/tests/integration/auth-google.test.js`

- [ ] **Step 1: Implement service**

`server/src/services/googleAuthService.js`:
```js
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

async function verifyIdToken(idToken) {
  const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload?.sub) throw new Error('Invalid Google token');
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    displayName: payload.name || null,
  };
}

module.exports = { verifyIdToken };
```

- [ ] **Step 2: Write failing test**

```js
jest.mock('../../src/services/googleAuthService');
const googleAuthService = require('../../src/services/googleAuthService');

const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('POST /auth/google', () => {
  it('creates new user from Google profile', async () => {
    googleAuthService.verifyIdToken.mockResolvedValue({
      googleId: 'g-123', email: 'g@b.com', emailVerified: true, displayName: 'Google User',
    });
    const res = await request(app()).post('/auth/google').send({ idToken: 'fake' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const user = await User.findOne({ email: 'g@b.com' });
    expect(user.googleId).toBe('g-123');
  });

  it('links to existing user by email', async () => {
    await User.create({ email: 'g@b.com', passwordHash: 'x' });
    googleAuthService.verifyIdToken.mockResolvedValue({
      googleId: 'g-123', email: 'g@b.com', emailVerified: true, displayName: null,
    });
    await request(app()).post('/auth/google').send({ idToken: 'fake' });
    const user = await User.findOne({ email: 'g@b.com' });
    expect(user.googleId).toBe('g-123');
  });

  it('rejects invalid token', async () => {
    googleAuthService.verifyIdToken.mockRejectedValue(new Error('bad'));
    const res = await request(app()).post('/auth/google').send({ idToken: 'fake' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Add to controller**

```js
const googleAuthService = require('../services/googleAuthService');

async function google(req, res) {
  const { idToken } = req.body;
  let profile;
  try {
    profile = await googleAuthService.verifyIdToken(idToken);
  } catch {
    throw new HttpError(401, 'Invalid Google token', 'INVALID_GOOGLE_TOKEN');
  }
  let user = await User.findOne({ $or: [{ googleId: profile.googleId }, { email: profile.email }] });
  if (!user) {
    user = await User.create({
      email: profile.email,
      googleId: profile.googleId,
      displayName: profile.displayName,
      emailVerifiedAt: profile.emailVerified ? new Date() : null,
    });
  } else {
    if (!user.googleId) user.googleId = profile.googleId;
    if (!user.emailVerifiedAt && profile.emailVerified) user.emailVerifiedAt = new Date();
    if (!user.displayName && profile.displayName) user.displayName = profile.displayName;
    await user.save();
  }
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = await issueRefreshToken(user);
  res.json({ accessToken, refreshToken, user });
}

module.exports = { signup, login, refresh, logout, magicRequest, magicVerify, google };
```

- [ ] **Step 4: Route**

```js
const { googleSchema } = require('../validators/authValidators');
router.post('/google', validate(googleSchema), asyncHandler(authController.google));
```

- [ ] **Step 5: Run — verify pass; commit**

```bash
git add server/src/services/googleAuthService.js server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-google.test.js
git commit -m "feat(server): POST /auth/google with ID-token verification"
```

---

## Task 24: `GET /auth/me`

**Files:**
- Modify controller + route
- Create: `server/tests/integration/auth-me.test.js`

- [ ] **Step 1: Write failing test**

```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
registerHooks();
const app = () => getApp();

describe('GET /auth/me', () => {
  it('returns current user for valid token', async () => {
    const user = await createUser({ email: 'me@b.com' });
    const res = await request(app()).get('/auth/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@b.com');
  });

  it('401 without token', async () => {
    const res = await request(app()).get('/auth/me');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Add to controller**

```js
async function me(req, res) {
  res.json({ user: req.user });
}
module.exports = { signup, login, refresh, logout, magicRequest, magicVerify, google, me };
```

- [ ] **Step 3: Route**

```js
const authRequired = require('../middleware/authRequired');
router.get('/me', authRequired(), asyncHandler(authController.me));
```

- [ ] **Step 4: Run — verify pass; commit**

```bash
git add server/src/controllers/authController.js server/src/routes/auth.js server/tests/integration/auth-me.test.js
git commit -m "feat(server): GET /auth/me"
```

---

## Task 25: Profile endpoints (GET + PATCH)

**Files:**
- Create: `server/src/validators/profileValidators.js`
- Create: `server/src/controllers/profileController.js`
- Modify: `server/src/routes/profile.js`
- Create: `server/tests/integration/profile.test.js`

- [ ] **Step 1: Validator**

`server/src/validators/profileValidators.js`:
```js
const { z } = require('zod');
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
}).strict();
module.exports = { updateProfileSchema };
```

- [ ] **Step 2: Failing test**

```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
registerHooks();
const app = () => getApp();

describe('profile endpoints', () => {
  it('GET /profile returns user', async () => {
    const user = await createUser({ email: 'p@b.com' });
    const res = await request(app()).get('/profile').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('p@b.com');
  });

  it('PATCH /profile updates displayName', async () => {
    const user = await createUser({ email: 'p@b.com' });
    const res = await request(app()).patch('/profile')
      .set(authHeader(user)).send({ displayName: 'NewName' });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe('NewName');
  });

  it('PATCH /profile rejects unknown field', async () => {
    const user = await createUser({ email: 'p@b.com' });
    const res = await request(app()).patch('/profile')
      .set(authHeader(user)).send({ role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('401 without token', async () => {
    const res = await request(app()).get('/profile');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Controller**

`server/src/controllers/profileController.js`:
```js
async function getProfile(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const { displayName } = req.body;
  if (displayName !== undefined) req.user.displayName = displayName;
  await req.user.save();
  res.json({ user: req.user });
}

module.exports = { getProfile, updateProfile };
```

- [ ] **Step 4: Route**

`server/src/routes/profile.js`:
```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { updateProfileSchema } = require('../validators/profileValidators');
const controller = require('../controllers/profileController');

router.get('/', authRequired(), asyncHandler(controller.getProfile));
router.patch('/', authRequired(), validate(updateProfileSchema), asyncHandler(controller.updateProfile));

module.exports = router;
```

- [ ] **Step 5: Run — verify pass; commit**

```bash
git add server/src/validators/profileValidators.js server/src/controllers/profileController.js server/src/routes/profile.js server/tests/integration/profile.test.js
git commit -m "feat(server): GET + PATCH /profile"
```

---

## Task 26: README + full test run

**Files:** Create: `server/README.md`

- [ ] **Step 1: Write README**

```markdown
# Bumper Stumpers Backend

Node.js + Express + MongoDB API for the puzzle game.

## Setup

1. `cp .env.example .env` — fill in secrets
2. Start a local MongoDB (Docker: `docker run -p 27017:27017 mongo:7`)
3. `npm install`
4. `npm run dev`

Server runs on `http://localhost:4000`.

## Auth endpoints

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | /auth/signup | — | `{ email, password, displayName? }` |
| POST | /auth/login | — | `{ email, password }` |
| POST | /auth/refresh | — | `{ refreshToken }` |
| POST | /auth/logout | — | `{ refreshToken }` |
| POST | /auth/magic/request | — | `{ email }` |
| POST | /auth/magic/verify | — | `{ token }` |
| POST | /auth/google | — | `{ idToken }` |
| GET | /auth/me | Bearer | — |
| GET | /profile | Bearer | — |
| PATCH | /profile | Bearer | `{ displayName? }` |

## Testing

`npm test` — runs full integration suite against in-memory MongoDB.
```

- [ ] **Step 2: Run the full suite**

```bash
npm test
```
Expected: all test files pass (env, user-model, password-service, token-service, auth-signup, auth-login, auth-refresh, auth-logout, auth-magic-link, auth-google, auth-me, profile).

- [ ] **Step 3: Commit**

```bash
git add server/README.md
git commit -m "docs(server): backend setup and API readme"
```

---

## Post-plan verification checklist

After all tasks complete:

- [ ] `cd server && npm test` — all tests pass
- [ ] `cd server && npm run dev` — server starts without errors (requires local MongoDB + real `.env`)
- [ ] `curl http://localhost:4000/health` — returns `{"status":"ok"}`
- [ ] Signup via `curl` returns `201` with `accessToken`, `refreshToken`, `user` (no `passwordHash`)
- [ ] `GET /auth/me` with Bearer token returns the user
- [ ] Replaying an already-used refresh token returns `401`

---

## Out of scope (tracked for later plans)

- Puzzle/Category/GameSession models + scoring (Plan 2)
- Frontend integration — login pages, API client (Plan 3)
- Stripe subscriptions + admin pricing (Plan 4)
- Admin panel CRUD (Plan 5)
- Leaderboards, ads, VPS deploy (Plan 6)
