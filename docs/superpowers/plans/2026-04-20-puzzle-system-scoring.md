# Puzzle System + Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the game's core mechanics to the existing Node/Express/MongoDB backend — categories, puzzles, game sessions, server-side scoring, hints, and plan-gated access (free tier: random non-premium puzzle; premium: pick from any category).

**Architecture:** Build on top of Plan 1's auth stack. Three new models (Category, Puzzle, GameSession) and their routes under `/categories`, `/sessions`. A session is the source-of-truth for scoring: client calls `/sessions/start` → server creates session + returns puzzle **without** the answer → client plays → client calls `/sessions/:id/hint` or `/sessions/:id/guess` → server validates and finalizes, returning the score. No score ever comes from the client. Plan gating is a thin middleware that reads `req.user.plan` and enforces limits at the route boundary.

**Tech Stack:** Reuses Plan 1 stack (Express 5, Mongoose 9, zod 4, Jest + Supertest + mongodb-memory-server). No new runtime dependencies.

---

## File Structure

```
server/
├── src/
│   ├── models/
│   │   ├── Category.js               # NEW: slug, name, icon, isPremium
│   │   ├── Puzzle.js                 # NEW: plate, answer, categoryId, difficulty, clue, revealSequence, basePoints, timeLimitSeconds, isPremium
│   │   └── GameSession.js            # NEW: userId, puzzleId, startedAt, completedAt, solved, score, hintsUsed, wrongGuesses, finalGuess
│   ├── services/
│   │   ├── scoringService.js         # NEW: pure calculateScore() + normalizeAnswer()
│   │   └── puzzleService.js          # NEW: pickRandomPuzzle(), pickByCategory()
│   ├── middleware/
│   │   └── requirePlan.js            # NEW: gate routes by req.user.plan
│   ├── validators/
│   │   └── sessionValidators.js      # NEW: start/hint/guess zod schemas
│   ├── controllers/
│   │   ├── categoryController.js     # NEW: list categories
│   │   └── sessionController.js      # NEW: start, hint, guess, list, detail
│   ├── routes/
│   │   ├── categories.js             # NEW: /categories router
│   │   └── sessions.js               # NEW: /sessions router
│   ├── app.js                        # MODIFY: mount /categories, /sessions
│   └── seed/
│       ├── seed.js                   # NEW: script to load categories + puzzles into DB
│       └── seed-data.js              # NEW: 6 categories + 30 puzzles
└── tests/
    └── integration/
        ├── category-model.test.js    # NEW
        ├── puzzle-model.test.js      # NEW
        ├── game-session-model.test.js # NEW
        ├── scoring-service.test.js   # NEW (pure logic, high coverage)
        ├── puzzle-service.test.js    # NEW
        ├── require-plan.test.js      # NEW
        ├── categories.test.js        # NEW: GET /categories
        ├── sessions-start.test.js    # NEW: POST /sessions/start
        ├── sessions-guess.test.js    # NEW: POST /sessions/:id/guess
        ├── sessions-hint.test.js     # NEW: POST /sessions/:id/hint
        └── sessions-list.test.js     # NEW: GET /sessions/me + GET /sessions/:id
```

**Notes:**
- All new code lives under `server/src/`. Frontend untouched.
- Seed script is runnable via `npm run seed` (add to `package.json`).
- Each test file maps to exactly one implementation file for easy navigation.

---

## API Contracts (reference)

All endpoints except `GET /categories` require Bearer auth.

| Method | Path | Auth | Plan gate | Body / Query |
|---|---|---|---|---|
| GET | /categories | — | — | — → `[{id, slug, name, icon, isPremium}]` |
| POST | /sessions/start | Bearer | — | `{ categorySlug? }` → `{ session, puzzle }` |
| POST | /sessions/:id/hint | Bearer | — | — → `{ hintsUsed, nextHint: {index, letter} }` |
| POST | /sessions/:id/guess | Bearer | — | `{ guess }` → `{ solved, score, correctAnswer, session }` |
| GET | /sessions/me | Bearer | — | `?page=&limit=` → `{ sessions[], total }` |
| GET | /sessions/:id | Bearer | — | — → `{ session }` |

**Plan gating rules:**
- Free users calling `POST /sessions/start` with `categorySlug` → `403 PLAN_REQUIRED`
- Free users can only receive non-premium puzzles (server picks randomly)
- Premium users can optionally pass `categorySlug` to pick; without it, random across all

---

## Scoring Formula (server-side only)

```
score = basePoints
      × timeBonus                 (max(0.1, 1 - elapsedSec / timeLimitSeconds))
      × difficultyMultiplier      (easy:1, medium:1.5, hard:2)
      × hintPenalty               (max(0.1, 1 - hintsUsed × 0.15))
      × wrongGuessPenalty         (max(0.3, 1 - wrongGuesses × 0.1))
```

All factors clamped. Result rounded to integer. Never negative.

---

## Answer Normalization

Guesses are case- and whitespace-insensitive. `"LOVE TOMORROW"` == `"love  tomorrow"` == `"Love Tomorrow"`.

`normalizeAnswer(str) => str.trim().toLowerCase().replace(/\s+/g, ' ')`

Stored puzzle answers are already normalized via Mongoose setter.

---

## Conventions

- All `Run:` commands execute from `server/` unless stated.
- TDD for all endpoint and service tasks.
- Each task ends with 1 commit.

---

## Task 1: Category model

**Files:**
- Create: `server/src/models/Category.js`
- Create: `server/tests/integration/category-model.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/category-model.test.js`:
```js
const { registerHooks } = require('../testSetup');
const Category = require('../../src/models/Category');

registerHooks();

describe('Category model', () => {
  it('creates with required fields and defaults', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    expect(cat.slug).toBe('movies');
    expect(cat.name).toBe('Movies');
    expect(cat.isPremium).toBe(false);
    expect(cat.icon).toBeNull();
  });

  it('enforces unique slug', async () => {
    await Category.create({ slug: 'movies', name: 'Movies' });
    await expect(
      Category.create({ slug: 'movies', name: 'Cinema' })
    ).rejects.toThrow();
  });

  it('lowercases and trims slug', async () => {
    const cat = await Category.create({ slug: '  MUSIC  ', name: 'Music' });
    expect(cat.slug).toBe('music');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

`cd server && npx jest tests/integration/category-model.test.js`

- [ ] **Step 3: Implement**

`server/src/models/Category.js`:
```js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^[a-z0-9-]+$/,
  },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: null, trim: true },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
```

- [ ] **Step 4: Run — expect PASS (3/3)**

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Category.js server/tests/integration/category-model.test.js
git commit -m "feat(server): add Category model"
```

---

## Task 2: Puzzle model

**Files:**
- Create: `server/src/models/Puzzle.js`
- Create: `server/tests/integration/puzzle-model.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/puzzle-model.test.js`:
```js
const { registerHooks } = require('../testSetup');
const Puzzle = require('../../src/models/Puzzle');
const Category = require('../../src/models/Category');

registerHooks();

describe('Puzzle model', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ slug: 'movies', name: 'Movies' });
  });

  it('creates a puzzle with defaults', async () => {
    const p = await Puzzle.create({
      plate: 'LUV2MRO',
      answer: 'love tomorrow',
      categoryId: category._id,
      difficulty: 'easy',
      clue: 'Feeling for the next day',
      revealSequence: [3, 1, 5, 0, 2, 4, 6],
    });
    expect(p.plate).toBe('LUV2MRO');
    expect(p.answer).toBe('love tomorrow');
    expect(p.basePoints).toBe(100);
    expect(p.timeLimitSeconds).toBe(60);
    expect(p.isPremium).toBe(false);
  });

  it('normalizes plate to uppercase and answer to lowercase on save', async () => {
    const p = await Puzzle.create({
      plate: ' luv2mro ',
      answer: '  LOVE  TOMORROW  ',
      categoryId: category._id,
      difficulty: 'easy',
      clue: 'x',
      revealSequence: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(p.plate).toBe('LUV2MRO');
    expect(p.answer).toBe('love tomorrow');
  });

  it('requires difficulty be one of the enum values', async () => {
    await expect(Puzzle.create({
      plate: 'X', answer: 'x',
      categoryId: category._id,
      difficulty: 'impossible',
      clue: 'x',
      revealSequence: [0],
    })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`server/src/models/Puzzle.js`:
```js
const mongoose = require('mongoose');

function normalizeAnswer(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const puzzleSchema = new mongoose.Schema({
  plate: {
    type: String, required: true, trim: true,
    set: (v) => String(v || '').trim().toUpperCase(),
  },
  answer: {
    type: String, required: true, trim: true,
    set: normalizeAnswer,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  clue: { type: String, required: true, trim: true },
  revealSequence: {
    type: [Number],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0,
  },
  basePoints: { type: Number, default: 100, min: 0 },
  timeLimitSeconds: { type: Number, default: 60, min: 5 },
  isPremium: { type: Boolean, default: false, index: true },
}, { timestamps: true });

puzzleSchema.index({ isPremium: 1, categoryId: 1 });

module.exports = mongoose.model('Puzzle', puzzleSchema);
```

- [ ] **Step 4: Run — expect PASS (3/3)**

- [ ] **Step 5: Commit**

```bash
git add server/src/models/Puzzle.js server/tests/integration/puzzle-model.test.js
git commit -m "feat(server): add Puzzle model with plate/answer normalization"
```

---

## Task 3: GameSession model

**Files:**
- Create: `server/src/models/GameSession.js`
- Create: `server/tests/integration/game-session-model.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/game-session-model.test.js`:
```js
const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const GameSession = require('../../src/models/GameSession');

registerHooks();

describe('GameSession model', () => {
  it('creates with sane defaults', async () => {
    const userId = new mongoose.Types.ObjectId();
    const puzzleId = new mongoose.Types.ObjectId();
    const s = await GameSession.create({ userId, puzzleId });
    expect(s.solved).toBe(false);
    expect(s.score).toBeNull();
    expect(s.hintsUsed).toBe(0);
    expect(s.wrongGuesses).toBe(0);
    expect(s.completedAt).toBeNull();
    expect(s.startedAt).toBeInstanceOf(Date);
  });

  it('requires userId and puzzleId', async () => {
    await expect(GameSession.create({})).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`server/src/models/GameSession.js`:
```js
const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  puzzleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Puzzle', required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  solved: { type: Boolean, default: false },
  score: { type: Number, default: null, min: 0 },
  hintsUsed: { type: Number, default: 0, min: 0 },
  wrongGuesses: { type: Number, default: 0, min: 0 },
  finalGuess: { type: String, default: null },
}, { timestamps: true });

gameSessionSchema.index({ userId: 1, startedAt: -1 });
gameSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
```

- [ ] **Step 4: Run — expect PASS (2/2)**

- [ ] **Step 5: Commit**

```bash
git add server/src/models/GameSession.js server/tests/integration/game-session-model.test.js
git commit -m "feat(server): add GameSession model"
```

---

## Task 4: Scoring service (pure logic)

**Files:**
- Create: `server/src/services/scoringService.js`
- Create: `server/tests/integration/scoring-service.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/scoring-service.test.js`:
```js
const { calculateScore, normalizeAnswer } = require('../../src/services/scoringService');

describe('scoringService.normalizeAnswer', () => {
  it('lowercases, trims, collapses spaces', () => {
    expect(normalizeAnswer('  LOVE   TOMORROW  ')).toBe('love tomorrow');
  });
  it('handles null/undefined', () => {
    expect(normalizeAnswer(null)).toBe('');
    expect(normalizeAnswer(undefined)).toBe('');
  });
});

describe('scoringService.calculateScore', () => {
  const puzzle = { basePoints: 100, difficulty: 'easy', timeLimitSeconds: 60 };

  it('returns basePoints when solved instantly with no hints or wrongs', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(100);
  });

  it('halves score at half the time limit', () => {
    const s = calculateScore({ puzzle, elapsedSec: 30, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(50);
  });

  it('applies difficulty multiplier', () => {
    const hardPuzzle = { ...puzzle, difficulty: 'hard' };
    const s = calculateScore({ puzzle: hardPuzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(200);
  });

  it('applies hint penalty (1 hint = 15% off)', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 1, wrongGuesses: 0 });
    expect(s).toBe(85);
  });

  it('applies wrong-guess penalty (2 wrongs = 20% off)', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 2 });
    expect(s).toBe(80);
  });

  it('clamps time bonus to 10% minimum', () => {
    const s = calculateScore({ puzzle, elapsedSec: 999, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(10);
  });

  it('clamps wrong-guess penalty to 30% minimum', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 99 });
    expect(s).toBe(30);
  });

  it('never returns negative', () => {
    const s = calculateScore({ puzzle, elapsedSec: 9999, hintsUsed: 99, wrongGuesses: 99 });
    expect(s).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`server/src/services/scoringService.js`:
```js
const DIFFICULTY_MULT = { easy: 1, medium: 1.5, hard: 2 };

function normalizeAnswer(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function calculateScore({ puzzle, elapsedSec, hintsUsed, wrongGuesses }) {
  const timeBonus = Math.max(0.1, 1 - elapsedSec / puzzle.timeLimitSeconds);
  const diffMult = DIFFICULTY_MULT[puzzle.difficulty] || 1;
  const hintPenalty = Math.max(0.1, 1 - hintsUsed * 0.15);
  const wrongPenalty = Math.max(0.3, 1 - wrongGuesses * 0.1);
  const raw = puzzle.basePoints * timeBonus * diffMult * hintPenalty * wrongPenalty;
  return Math.max(0, Math.round(raw));
}

module.exports = { calculateScore, normalizeAnswer };
```

- [ ] **Step 4: Run — expect PASS (10/10)**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/scoringService.js server/tests/integration/scoring-service.test.js
git commit -m "feat(server): add scoring service with pure calculateScore"
```

---

## Task 5: Puzzle service (random selection)

**Files:**
- Create: `server/src/services/puzzleService.js`
- Create: `server/tests/integration/puzzle-service.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/puzzle-service.test.js`:
```js
const { registerHooks } = require('../testSetup');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const { pickRandomPuzzle } = require('../../src/services/puzzleService');

registerHooks();

async function seedFixtures() {
  const movies = await Category.create({ slug: 'movies', name: 'Movies', isPremium: false });
  const music = await Category.create({ slug: 'music', name: 'Music', isPremium: true });
  await Puzzle.create({
    plate: 'A1', answer: 'a', categoryId: movies._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0, 1], isPremium: false,
  });
  await Puzzle.create({
    plate: 'A2', answer: 'b', categoryId: movies._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0, 1], isPremium: true,
  });
  await Puzzle.create({
    plate: 'A3', answer: 'c', categoryId: music._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0, 1], isPremium: true,
  });
  return { movies, music };
}

describe('puzzleService.pickRandomPuzzle', () => {
  it('returns any non-premium puzzle when { freeOnly: true }', async () => {
    await seedFixtures();
    const p = await pickRandomPuzzle({ freeOnly: true });
    expect(p).not.toBeNull();
    expect(p.isPremium).toBe(false);
  });

  it('filters by category slug when provided', async () => {
    const { music } = await seedFixtures();
    const p = await pickRandomPuzzle({ categorySlug: 'music', freeOnly: false });
    expect(p.categoryId.toString()).toBe(music._id.toString());
  });

  it('returns null when no puzzle matches', async () => {
    const p = await pickRandomPuzzle({ categorySlug: 'nonexistent', freeOnly: false });
    expect(p).toBeNull();
  });

  it('never returns premium when freeOnly is true, even with categorySlug', async () => {
    await seedFixtures();
    const p = await pickRandomPuzzle({ categorySlug: 'music', freeOnly: true });
    // music category only has premium puzzles → should be null
    expect(p).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`server/src/services/puzzleService.js`:
```js
const Puzzle = require('../models/Puzzle');
const Category = require('../models/Category');

async function pickRandomPuzzle({ categorySlug, freeOnly } = {}) {
  const filter = {};
  if (freeOnly) filter.isPremium = false;
  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) return null;
    filter.categoryId = category._id;
  }
  const results = await Puzzle.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);
  if (results.length === 0) return null;
  return Puzzle.findById(results[0]._id);
}

module.exports = { pickRandomPuzzle };
```

- [ ] **Step 4: Run — expect PASS (4/4)**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/puzzleService.js server/tests/integration/puzzle-service.test.js
git commit -m "feat(server): add puzzleService.pickRandomPuzzle with category + plan filter"
```

---

## Task 6: requirePlan middleware

**Files:**
- Create: `server/src/middleware/requirePlan.js`
- Create: `server/tests/integration/require-plan.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/require-plan.test.js`:
```js
const express = require('express');
const request = require('supertest');
const { registerHooks } = require('../testSetup');
const { createUser, authHeader } = require('../helpers');
const authRequired = require('../../src/middleware/authRequired');
const requirePlan = require('../../src/middleware/requirePlan');
const { errorHandler } = require('../../src/middleware/errorHandler');

registerHooks();

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/premium', authRequired(), requirePlan('premium'), (req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('requirePlan middleware', () => {
  it('allows a premium user through the gate', async () => {
    const app = buildApp();
    const user = await createUser({ email: 'prem@b.com', plan: 'premium' });
    const res = await request(app).get('/premium').set(authHeader(user));
    expect(res.status).toBe(200);
  });

  it('blocks a free user with 403 PLAN_REQUIRED', async () => {
    const app = buildApp();
    const user = await createUser({ email: 'free@b.com', plan: 'free' });
    const res = await request(app).get('/premium').set(authHeader(user));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

`server/src/middleware/requirePlan.js`:
```js
const { HttpError } = require('./errorHandler');

module.exports = function requirePlan(required) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Unauthorized', 'UNAUTHORIZED'));
    if (req.user.plan !== required) {
      return next(new HttpError(403, `${required} plan required`, 'PLAN_REQUIRED'));
    }
    next();
  };
};
```

- [ ] **Step 4: Run — expect PASS (2/2)**

- [ ] **Step 5: Commit**

```bash
git add server/src/middleware/requirePlan.js server/tests/integration/require-plan.test.js
git commit -m "feat(server): requirePlan middleware"
```

---

## Task 7: Session validators

**Files:**
- Create: `server/src/validators/sessionValidators.js`

- [ ] **Step 1: Implement**

`server/src/validators/sessionValidators.js`:
```js
const { z } = require('zod');

const startSessionSchema = z.object({
  categorySlug: z.string().min(1).max(40).regex(/^[a-z0-9-]+$/).optional(),
}).strict();

const guessSchema = z.object({
  guess: z.string().min(1).max(200),
}).strict();

const mongoIdSchema = z.string().regex(/^[a-f0-9]{24}$/);

const listSessionsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

module.exports = { startSessionSchema, guessSchema, mongoIdSchema, listSessionsQuery };
```

- [ ] **Step 2: Commit**

```bash
git add server/src/validators/sessionValidators.js
git commit -m "feat(server): zod validators for sessions + categories"
```

> No test — validators are exercised by endpoint tests.

---

## Task 8: Categories controller + route + endpoint test

**Files:**
- Create: `server/src/controllers/categoryController.js`
- Create: `server/src/routes/categories.js`
- Modify: `server/src/app.js`
- Create: `server/tests/integration/categories.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/categories.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request } = require('../helpers');
const Category = require('../../src/models/Category');

registerHooks();
const app = () => getApp();

describe('GET /categories', () => {
  beforeEach(async () => {
    await Category.create({ slug: 'movies', name: 'Movies', isPremium: false });
    await Category.create({ slug: 'music', name: 'Music', isPremium: true });
  });

  it('returns all categories sorted by name', async () => {
    const res = await request(app()).get('/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
    expect(res.body.categories[0].slug).toBe('movies'); // 'Movies' < 'Music'
    expect(res.body.categories[1].slug).toBe('music');
    expect(res.body.categories[0]).toMatchObject({
      slug: 'movies', name: 'Movies', isPremium: false,
    });
  });
});
```

- [ ] **Step 2: Run — expect FAIL (404)**

- [ ] **Step 3: Implement controller**

`server/src/controllers/categoryController.js`:
```js
const Category = require('../models/Category');

async function listCategories(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
}

module.exports = { listCategories };
```

- [ ] **Step 4: Implement route**

`server/src/routes/categories.js`:
```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/categoryController');

router.get('/', asyncHandler(controller.listCategories));

module.exports = router;
```

- [ ] **Step 5: Mount in `server/src/app.js`**

Add above `app.use('/auth', ...)`:
```js
const categoryRoutes = require('./routes/categories');
// ...
app.use('/categories', categoryRoutes);
```

- [ ] **Step 6: Run — expect PASS (1/1)**

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/categoryController.js server/src/routes/categories.js server/src/app.js server/tests/integration/categories.test.js
git commit -m "feat(server): GET /categories"
```

---

## Task 9: POST /sessions/start

**Files:**
- Create: `server/src/controllers/sessionController.js`
- Create: `server/src/routes/sessions.js`
- Modify: `server/src/app.js`
- Create: `server/tests/integration/sessions-start.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/sessions-start.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');

registerHooks();
const app = () => getApp();

async function seedPuzzle({ isPremium = false, slug = 'movies' } = {}) {
  let cat = await Category.findOne({ slug });
  if (!cat) cat = await Category.create({ slug, name: slug, isPremium });
  return Puzzle.create({
    plate: 'LUV2MRO',
    answer: 'love tomorrow',
    categoryId: cat._id,
    difficulty: 'easy',
    clue: 'feeling',
    revealSequence: [3, 1, 5, 0, 2, 4, 6],
    isPremium,
  });
}

describe('POST /sessions/start', () => {
  it('free user: returns random non-premium puzzle without the answer', async () => {
    await seedPuzzle({ isPremium: false });
    const user = await createUser({ plan: 'free' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({});
    expect(res.status).toBe(201);
    expect(res.body.session.id).toBeDefined();
    expect(res.body.puzzle.plate).toBe('LUV2MRO');
    expect(res.body.puzzle.answer).toBeUndefined();
    expect(res.body.puzzle.revealSequence).toEqual([3, 1, 5, 0, 2, 4, 6]);
    const count = await GameSession.countDocuments({ userId: user._id });
    expect(count).toBe(1);
  });

  it('free user: passing categorySlug is ignored silently (still gets non-premium)', async () => {
    // Seed two categories, free puzzle only in movies
    await seedPuzzle({ isPremium: false, slug: 'movies' });
    await seedPuzzle({ isPremium: true, slug: 'music' });
    const user = await createUser({ plan: 'free' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({ categorySlug: 'music' });
    // Per spec: free users calling /start with categorySlug get 403 PLAN_REQUIRED
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
  });

  it('premium user: can pick category', async () => {
    await seedPuzzle({ isPremium: true, slug: 'music' });
    const user = await createUser({ plan: 'premium' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({ categorySlug: 'music' });
    expect(res.status).toBe(201);
    expect(res.body.puzzle).toBeDefined();
  });

  it('premium user: no category returns random across all', async () => {
    await seedPuzzle({ isPremium: true, slug: 'music' });
    const user = await createUser({ plan: 'premium' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({});
    expect(res.status).toBe(201);
    expect(res.body.puzzle).toBeDefined();
  });

  it('returns 404 when no puzzle matches', async () => {
    const user = await createUser({ plan: 'premium' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({ categorySlug: 'none' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NO_PUZZLE_AVAILABLE');
  });

  it('requires auth', async () => {
    const res = await request(app()).post('/sessions/start').send({});
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement controller**

`server/src/controllers/sessionController.js`:
```js
const GameSession = require('../models/GameSession');
const { pickRandomPuzzle } = require('../services/puzzleService');
const { HttpError } = require('../middleware/errorHandler');

function serializePuzzle(puzzle) {
  return {
    id: puzzle._id,
    plate: puzzle.plate,
    categoryId: puzzle.categoryId,
    difficulty: puzzle.difficulty,
    clue: puzzle.clue,
    revealSequence: puzzle.revealSequence,
    basePoints: puzzle.basePoints,
    timeLimitSeconds: puzzle.timeLimitSeconds,
  };
}

function serializeSession(session) {
  return {
    id: session._id,
    userId: session.userId,
    puzzleId: session.puzzleId,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    solved: session.solved,
    score: session.score,
    hintsUsed: session.hintsUsed,
    wrongGuesses: session.wrongGuesses,
    finalGuess: session.finalGuess,
  };
}

async function startSession(req, res) {
  const { categorySlug } = req.body;
  const isFree = req.user.plan !== 'premium';

  if (isFree && categorySlug) {
    throw new HttpError(403, 'Premium plan required to choose a category', 'PLAN_REQUIRED');
  }

  const puzzle = await pickRandomPuzzle({
    categorySlug,
    freeOnly: isFree,
  });
  if (!puzzle) throw new HttpError(404, 'No puzzle available', 'NO_PUZZLE_AVAILABLE');

  const session = await GameSession.create({
    userId: req.user._id,
    puzzleId: puzzle._id,
  });

  res.status(201).json({
    session: serializeSession(session),
    puzzle: serializePuzzle(puzzle),
  });
}

module.exports = { startSession, serializeSession, serializePuzzle };
```

- [ ] **Step 4: Implement route**

`server/src/routes/sessions.js`:
```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { startSessionSchema } = require('../validators/sessionValidators');
const controller = require('../controllers/sessionController');

router.post(
  '/start',
  authRequired(),
  validate(startSessionSchema),
  asyncHandler(controller.startSession)
);

module.exports = router;
```

- [ ] **Step 5: Mount in `server/src/app.js`**

```js
const sessionRoutes = require('./routes/sessions');
// ...
app.use('/sessions', sessionRoutes);
```

- [ ] **Step 6: Run — expect PASS (6/6)**

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/sessionController.js server/src/routes/sessions.js server/src/app.js server/tests/integration/sessions-start.test.js
git commit -m "feat(server): POST /sessions/start with plan gating"
```

---

## Task 10: POST /sessions/:id/guess

**Files:**
- Modify: `server/src/controllers/sessionController.js` (add `submitGuess`)
- Modify: `server/src/routes/sessions.js` (add guess route)
- Create: `server/tests/integration/sessions-guess.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/sessions-guess.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');
const mongoose = require('mongoose');

registerHooks();
const app = () => getApp();

async function seed() {
  const cat = await Category.create({ slug: 'movies', name: 'Movies' });
  const puzzle = await Puzzle.create({
    plate: 'LUV2MRO',
    answer: 'love tomorrow',
    categoryId: cat._id,
    difficulty: 'easy',
    clue: 'feeling',
    revealSequence: [0, 1, 2, 3, 4, 5, 6],
    basePoints: 100,
    timeLimitSeconds: 60,
  });
  const user = await createUser();
  const session = await GameSession.create({ userId: user._id, puzzleId: puzzle._id });
  return { cat, puzzle, user, session };
}

describe('POST /sessions/:id/guess', () => {
  it('accepts the correct answer case-insensitively and finalizes', async () => {
    const { session, user, puzzle } = await seed();
    const res = await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'Love   Tomorrow' });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
    expect(res.body.score).toBeGreaterThan(0);
    expect(res.body.correctAnswer).toBe('love tomorrow');
    const stored = await GameSession.findById(session._id);
    expect(stored.solved).toBe(true);
    expect(stored.score).toBe(res.body.score);
    expect(stored.completedAt).not.toBeNull();
  });

  it('rejects wrong answer, increments wrongGuesses, does not finalize', async () => {
    const { session, user } = await seed();
    const res = await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'hate yesterday' });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(false);
    expect(res.body.session.wrongGuesses).toBe(1);
    expect(res.body.session.completedAt).toBeNull();
  });

  it('returns 404 for unknown session id', async () => {
    const { user } = await seed();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app()).post(`/sessions/${fakeId}/guess`)
      .set(authHeader(user)).send({ guess: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 403 if session belongs to a different user', async () => {
    const { session } = await seed();
    const otherUser = await createUser({ email: 'other@b.com' });
    const res = await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(otherUser)).send({ guess: 'x' });
    expect(res.status).toBe(403);
  });

  it('returns 409 if session is already completed', async () => {
    const { session, user } = await seed();
    await GameSession.updateOne({ _id: session._id }, { $set: { completedAt: new Date(), solved: true, score: 100 } });
    const res = await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'love tomorrow' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SESSION_COMPLETED');
  });

  it('returns 400 for malformed session id', async () => {
    const { user } = await seed();
    const res = await request(app()).post('/sessions/not-a-mongoid/guess')
      .set(authHeader(user)).send({ guess: 'x' });
    expect(res.status).toBe(400);
  });

  it('caps score at 0 never negative even if time is way past limit', async () => {
    const { session, user } = await seed();
    // Back-date startedAt to 9999 seconds ago
    await GameSession.updateOne({ _id: session._id }, { $set: { startedAt: new Date(Date.now() - 9_999_000) } });
    const res = await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'love tomorrow' });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
    expect(res.body.score).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add `submitGuess` to `server/src/controllers/sessionController.js`**

Imports at top (add to existing):
```js
const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
const { calculateScore, normalizeAnswer } = require('../services/scoringService');
const { mongoIdSchema } = require('../validators/sessionValidators');
```

Handler:
```js
async function submitGuess(req, res) {
  const idCheck = mongoIdSchema.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid session id', 'INVALID_ID');
  const session = await GameSession.findById(req.params.id);
  if (!session) throw new HttpError(404, 'Session not found', 'NOT_FOUND');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (session.completedAt) throw new HttpError(409, 'Session already completed', 'SESSION_COMPLETED');

  const puzzle = await Puzzle.findById(session.puzzleId);
  if (!puzzle) throw new HttpError(404, 'Puzzle not found', 'NOT_FOUND');

  const normalizedGuess = normalizeAnswer(req.body.guess);
  const correct = normalizedGuess === puzzle.answer;

  if (!correct) {
    session.wrongGuesses += 1;
    await session.save();
    return res.json({
      solved: false,
      session: serializeSession(session),
    });
  }

  const elapsedSec = Math.max(0, (Date.now() - session.startedAt.getTime()) / 1000);
  const score = calculateScore({
    puzzle,
    elapsedSec,
    hintsUsed: session.hintsUsed,
    wrongGuesses: session.wrongGuesses,
  });

  session.solved = true;
  session.score = score;
  session.completedAt = new Date();
  session.finalGuess = normalizedGuess;
  await session.save();

  res.json({
    solved: true,
    score,
    correctAnswer: puzzle.answer,
    session: serializeSession(session),
  });
}

module.exports = { startSession, submitGuess, serializeSession, serializePuzzle };
```

- [ ] **Step 4: Wire route — add to `server/src/routes/sessions.js`**

```js
const { guessSchema } = require('../validators/sessionValidators');

router.post(
  '/:id/guess',
  authRequired(),
  validate(guessSchema),
  asyncHandler(controller.submitGuess)
);
```

- [ ] **Step 5: Run — expect PASS (7/7)**

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/sessionController.js server/src/routes/sessions.js server/tests/integration/sessions-guess.test.js
git commit -m "feat(server): POST /sessions/:id/guess with server-side scoring"
```

---

## Task 11: POST /sessions/:id/hint

**Files:**
- Modify: `server/src/controllers/sessionController.js` (add `requestHint`)
- Modify: `server/src/routes/sessions.js` (add hint route)
- Create: `server/tests/integration/sessions-hint.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/sessions-hint.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');

registerHooks();
const app = () => getApp();

async function seed() {
  const cat = await Category.create({ slug: 'movies', name: 'Movies' });
  const puzzle = await Puzzle.create({
    plate: 'ABCDE',
    answer: 'alpha',
    categoryId: cat._id,
    difficulty: 'easy',
    clue: 'x',
    revealSequence: [2, 0, 4, 1, 3],
  });
  const user = await createUser();
  const session = await GameSession.create({ userId: user._id, puzzleId: puzzle._id });
  return { puzzle, user, session };
}

describe('POST /sessions/:id/hint', () => {
  it('returns the next letter per revealSequence and increments hintsUsed', async () => {
    const { session, user, puzzle } = await seed();
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.hintsUsed).toBe(1);
    expect(res.body.nextHint).toEqual({ index: 2, letter: 'P' }); // 'alpha'[2] = 'p' → 'P'
    const stored = await GameSession.findById(session._id);
    expect(stored.hintsUsed).toBe(1);
  });

  it('second hint reveals the second index', async () => {
    const { session, user } = await seed();
    await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    expect(res.body.hintsUsed).toBe(2);
    expect(res.body.nextHint).toEqual({ index: 0, letter: 'A' });
  });

  it('returns 409 when all hints exhausted', async () => {
    const { session, user } = await seed();
    // Use up all 5 hints
    for (let i = 0; i < 5; i++) {
      await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    }
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_MORE_HINTS');
  });

  it('returns 409 when session already completed', async () => {
    const { session, user } = await seed();
    await GameSession.updateOne({ _id: session._id }, { $set: { completedAt: new Date(), solved: true, score: 1 } });
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    expect(res.status).toBe(409);
  });

  it('returns 403 for other user', async () => {
    const { session } = await seed();
    const other = await createUser({ email: 'other@b.com' });
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(other));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add `requestHint` handler**

Append in `server/src/controllers/sessionController.js`:
```js
async function requestHint(req, res) {
  const idCheck = mongoIdSchema.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid session id', 'INVALID_ID');
  const session = await GameSession.findById(req.params.id);
  if (!session) throw new HttpError(404, 'Session not found', 'NOT_FOUND');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (session.completedAt) throw new HttpError(409, 'Session already completed', 'SESSION_COMPLETED');

  const puzzle = await Puzzle.findById(session.puzzleId);
  if (!puzzle) throw new HttpError(404, 'Puzzle not found', 'NOT_FOUND');

  if (session.hintsUsed >= puzzle.revealSequence.length) {
    throw new HttpError(409, 'No more hints available', 'NO_MORE_HINTS');
  }

  const index = puzzle.revealSequence[session.hintsUsed];
  const letter = puzzle.answer.charAt(index).toUpperCase();

  session.hintsUsed += 1;
  await session.save();

  res.json({ hintsUsed: session.hintsUsed, nextHint: { index, letter } });
}

module.exports = {
  startSession, submitGuess, requestHint,
  serializeSession, serializePuzzle,
};
```

- [ ] **Step 4: Wire route**

Add in `server/src/routes/sessions.js`:
```js
router.post('/:id/hint', authRequired(), asyncHandler(controller.requestHint));
```

- [ ] **Step 5: Run — expect PASS (5/5)**

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/sessionController.js server/src/routes/sessions.js server/tests/integration/sessions-hint.test.js
git commit -m "feat(server): POST /sessions/:id/hint"
```

---

## Task 12: GET /sessions/me + GET /sessions/:id

**Files:**
- Modify: `server/src/controllers/sessionController.js` (add `listMySessions`, `getSession`)
- Modify: `server/src/routes/sessions.js` (add routes)
- Create: `server/tests/integration/sessions-list.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/sessions-list.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');
const mongoose = require('mongoose');

registerHooks();
const app = () => getApp();

async function seed() {
  const cat = await Category.create({ slug: 'movies', name: 'Movies' });
  const puzzle = await Puzzle.create({
    plate: 'X', answer: 'x', categoryId: cat._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0],
  });
  return { puzzle };
}

describe('GET /sessions/me', () => {
  it('returns paginated sessions for current user, newest first', async () => {
    const { puzzle } = await seed();
    const user = await createUser();
    const s1 = await GameSession.create({ userId: user._id, puzzleId: puzzle._id });
    await new Promise(r => setTimeout(r, 10));
    const s2 = await GameSession.create({ userId: user._id, puzzleId: puzzle._id });

    const res = await request(app()).get('/sessions/me').set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.sessions).toHaveLength(2);
    expect(res.body.sessions[0].id).toBe(s2._id.toString());
    expect(res.body.sessions[1].id).toBe(s1._id.toString());
  });

  it('excludes other users sessions', async () => {
    const { puzzle } = await seed();
    const user = await createUser({ email: 'me@b.com' });
    const other = await createUser({ email: 'other@b.com' });
    await GameSession.create({ userId: other._id, puzzleId: puzzle._id });
    const res = await request(app()).get('/sessions/me').set(authHeader(user));
    expect(res.body.total).toBe(0);
    expect(res.body.sessions).toHaveLength(0);
  });

  it('paginates with page+limit', async () => {
    const { puzzle } = await seed();
    const user = await createUser();
    for (let i = 0; i < 5; i++) {
      await GameSession.create({ userId: user._id, puzzleId: puzzle._id });
    }
    const res = await request(app()).get('/sessions/me?page=2&limit=2').set(authHeader(user));
    expect(res.body.total).toBe(5);
    expect(res.body.sessions).toHaveLength(2);
  });

  it('requires auth', async () => {
    const res = await request(app()).get('/sessions/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /sessions/:id', () => {
  it('returns session owned by user', async () => {
    const { puzzle } = await seed();
    const user = await createUser();
    const session = await GameSession.create({ userId: user._id, puzzleId: puzzle._id });
    const res = await request(app()).get(`/sessions/${session._id}`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe(session._id.toString());
  });

  it('403 when owned by another user', async () => {
    const { puzzle } = await seed();
    const user = await createUser({ email: 'me@b.com' });
    const other = await createUser({ email: 'other@b.com' });
    const session = await GameSession.create({ userId: other._id, puzzleId: puzzle._id });
    const res = await request(app()).get(`/sessions/${session._id}`).set(authHeader(user));
    expect(res.status).toBe(403);
  });

  it('404 when not found', async () => {
    const user = await createUser();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app()).get(`/sessions/${fakeId}`).set(authHeader(user));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Add handlers**

Append to `server/src/controllers/sessionController.js`:
```js
const { listSessionsQuery } = require('../validators/sessionValidators');

async function listMySessions(req, res) {
  const parsed = listSessionsQuery.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'Invalid query', 'VALIDATION_ERROR');
  const { page, limit } = parsed.data;
  const filter = { userId: req.user._id };
  const [sessions, total] = await Promise.all([
    GameSession.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit),
    GameSession.countDocuments(filter),
  ]);
  res.json({ total, sessions: sessions.map(serializeSession), page, limit });
}

async function getSession(req, res) {
  const idCheck = mongoIdSchema.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid session id', 'INVALID_ID');
  const session = await GameSession.findById(req.params.id);
  if (!session) throw new HttpError(404, 'Session not found', 'NOT_FOUND');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }
  res.json({ session: serializeSession(session) });
}

module.exports = {
  startSession, submitGuess, requestHint,
  listMySessions, getSession,
  serializeSession, serializePuzzle,
};
```

- [ ] **Step 4: Wire routes**

Add to `server/src/routes/sessions.js`:
```js
router.get('/me', authRequired(), asyncHandler(controller.listMySessions));
router.get('/:id', authRequired(), asyncHandler(controller.getSession));
```

**Important ordering:** `/me` must be defined BEFORE `/:id` or Express will match `/me` as an id and 400.

- [ ] **Step 5: Run — expect PASS (7/7)**

- [ ] **Step 6: Commit**

```bash
git add server/src/controllers/sessionController.js server/src/routes/sessions.js server/tests/integration/sessions-list.test.js
git commit -m "feat(server): GET /sessions/me and GET /sessions/:id"
```

---

## Task 13: Seed data + npm script

**Files:**
- Create: `server/src/seed/seed-data.js`
- Create: `server/src/seed/seed.js`
- Modify: `server/package.json` (add `seed` script)
- Modify: `server/README.md` (document seeding)

- [ ] **Step 1: Create seed data**

`server/src/seed/seed-data.js`:
```js
module.exports = {
  categories: [
    { slug: 'movies', name: 'Movies', icon: '/movies.png', isPremium: false },
    { slug: 'music', name: 'Music', icon: '/music.png', isPremium: false },
    { slug: 'technology', name: 'Technology', icon: '/technology.png', isPremium: false },
    { slug: 'food', name: 'Food', icon: '/food.png', isPremium: true },
    { slug: 'animals', name: 'Animals', icon: '/animal.png', isPremium: true },
    { slug: 'random', name: 'Random', icon: '/random.png', isPremium: true },
  ],
  puzzles: [
    // movies (free)
    { plate: 'LV2MRO', answer: 'love tomorrow', categorySlug: 'movies', difficulty: 'easy',
      clue: 'A romantic outlook on the next day', revealSequence: [0, 2, 4, 5, 8, 1, 3, 6, 7, 9, 10, 11], isPremium: false },
    { plate: '4GOTN1', answer: 'forgotten one', categorySlug: 'movies', difficulty: 'medium',
      clue: 'A solitary memory lost to time', revealSequence: [0, 3, 6, 9, 1, 2, 4, 5, 7, 8, 10, 11], isPremium: false },
    { plate: 'BTMAN4', answer: 'batman four', categorySlug: 'movies', difficulty: 'easy',
      clue: 'Fourth outing of the caped crusader', revealSequence: [0, 2, 4, 6, 8, 1, 3, 5, 7, 9], isPremium: false },
    { plate: 'JAWS3D', answer: 'jaws three d', categorySlug: 'movies', difficulty: 'medium',
      clue: 'Third aquatic horror in depth', revealSequence: [0, 3, 7, 11, 1, 2, 4, 5, 6, 8, 9, 10], isPremium: false },
    { plate: 'STRW4R', answer: 'star wars', categorySlug: 'movies', difficulty: 'easy',
      clue: 'Galactic conflict franchise', revealSequence: [0, 4, 5, 8, 1, 2, 3, 6, 7], isPremium: false },

    // music (free)
    { plate: 'ROCK99', answer: 'rock nine nine', categorySlug: 'music', difficulty: 'easy',
      clue: 'A loud genre and the year it peaked', revealSequence: [0, 4, 5, 9, 10, 1, 2, 3, 6, 7, 8, 11, 12, 13], isPremium: false },
    { plate: 'BLUZ4U', answer: 'blues for you', categorySlug: 'music', difficulty: 'medium',
      clue: 'A sad song dedication', revealSequence: [0, 2, 5, 6, 9, 10, 1, 3, 4, 7, 8, 11, 12], isPremium: false },
    { plate: 'PNKFLD', answer: 'pink floyd', categorySlug: 'music', difficulty: 'medium',
      clue: 'A prismatic progressive band', revealSequence: [0, 4, 5, 9, 1, 2, 3, 6, 7, 8], isPremium: false },
    { plate: 'JZZ4EV', answer: 'jazz forever', categorySlug: 'music', difficulty: 'medium',
      clue: 'Improvisation endures', revealSequence: [0, 4, 7, 11, 1, 2, 3, 5, 6, 8, 9, 10], isPremium: false },

    // technology (free)
    { plate: 'CODR42', answer: 'coder forty two', categorySlug: 'technology', difficulty: 'hard',
      clue: 'A programmer and the answer to everything', revealSequence: [0, 5, 9, 13, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12], isPremium: false },
    { plate: 'AIRULZ', answer: 'ai rules', categorySlug: 'technology', difficulty: 'easy',
      clue: 'Machines triumphant', revealSequence: [0, 2, 3, 7, 1, 4, 5, 6], isPremium: false },
    { plate: 'NET2WK', answer: 'network', categorySlug: 'technology', difficulty: 'easy',
      clue: 'Connected computers', revealSequence: [0, 3, 6, 1, 2, 4, 5], isPremium: false },

    // food (premium)
    { plate: 'PIZZA1', answer: 'pizza one', categorySlug: 'food', difficulty: 'easy',
      clue: 'Numbered Italian pie', revealSequence: [0, 5, 6, 8, 1, 2, 3, 4, 7], isPremium: true },
    { plate: 'SUSHI4', answer: 'sushi four', categorySlug: 'food', difficulty: 'medium',
      clue: 'Raw fish quartet', revealSequence: [0, 5, 6, 9, 1, 2, 3, 4, 7, 8], isPremium: true },
    { plate: 'TACO2U', answer: 'taco to you', categorySlug: 'food', difficulty: 'medium',
      clue: 'Delivery order', revealSequence: [0, 4, 5, 7, 8, 1, 2, 3, 6, 9, 10], isPremium: true },

    // animals (premium)
    { plate: 'LION42', answer: 'lion forty two', categorySlug: 'animals', difficulty: 'hard',
      clue: 'King of beasts plus a famous number', revealSequence: [0, 4, 5, 10, 13, 1, 2, 3, 6, 7, 8, 9, 11, 12], isPremium: true },
    { plate: 'WOLF99', answer: 'wolf nine nine', categorySlug: 'animals', difficulty: 'medium',
      clue: 'Pack leader at the end of the century', revealSequence: [0, 4, 5, 9, 10, 1, 2, 3, 6, 7, 8, 11, 12, 13], isPremium: true },
    { plate: 'TIGR8R', answer: 'tiger eight r', categorySlug: 'animals', difficulty: 'hard',
      clue: 'Striped cat with a number and letter', revealSequence: [0, 5, 6, 10, 11, 1, 2, 3, 4, 7, 8, 9, 12], isPremium: true },

    // random (premium)
    { plate: 'MIXD1T', answer: 'mixed it', categorySlug: 'random', difficulty: 'medium',
      clue: 'Combined them', revealSequence: [0, 5, 6, 7, 1, 2, 3, 4], isPremium: true },
    { plate: 'RND0MZ', answer: 'random z', categorySlug: 'random', difficulty: 'medium',
      clue: 'Unpredictable ending', revealSequence: [0, 6, 7, 1, 2, 3, 4, 5], isPremium: true },
  ],
};
```

- [ ] **Step 2: Create seed script**

`server/src/seed/seed.js`:
```js
/* eslint-disable no-console */
const env = require('../config/env');
const { connect, disconnect } = require('../config/db');
const Category = require('../models/Category');
const Puzzle = require('../models/Puzzle');
const seedData = require('./seed-data');

async function run() {
  console.log(`Seeding to ${env.MONGODB_URI}`);
  await connect();

  for (const cat of seedData.categories) {
    await Category.updateOne({ slug: cat.slug }, { $set: cat }, { upsert: true });
  }
  console.log(`Upserted ${seedData.categories.length} categories`);

  for (const p of seedData.puzzles) {
    const category = await Category.findOne({ slug: p.categorySlug });
    if (!category) {
      console.warn(`Skipping puzzle ${p.plate}: category ${p.categorySlug} not found`);
      continue;
    }
    const { categorySlug, ...puzzleFields } = p;
    await Puzzle.updateOne(
      { plate: p.plate.toUpperCase() },
      { $set: { ...puzzleFields, categoryId: category._id } },
      { upsert: true }
    );
  }
  console.log(`Upserted ${seedData.puzzles.length} puzzles`);

  await disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Add `seed` npm script**

In `server/package.json`, add to `scripts`:
```json
"seed": "node src/seed/seed.js"
```

- [ ] **Step 4: Update README**

In `server/README.md` "Setup" section, add after step 4:
```markdown
5. `npm run seed` — load starter categories + puzzles into your local MongoDB
```

- [ ] **Step 5: Smoke-test via test DB**

Quick manual check using the in-memory DB path won't work for the seed script (it connects to `env.MONGODB_URI`, not the in-memory server). Instead, write a smoke test:

Create `server/tests/integration/seed-smoke.test.js`:
```js
const { registerHooks } = require('../testSetup');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const seedData = require('../../src/seed/seed-data');

registerHooks();

describe('seed data integrity', () => {
  it('has at least 6 categories', () => {
    expect(seedData.categories.length).toBeGreaterThanOrEqual(6);
  });

  it('has at least 15 puzzles', () => {
    expect(seedData.puzzles.length).toBeGreaterThanOrEqual(15);
  });

  it('every puzzle references a defined category slug', () => {
    const slugs = new Set(seedData.categories.map(c => c.slug));
    for (const p of seedData.puzzles) {
      expect(slugs.has(p.categorySlug)).toBe(true);
    }
  });

  it('revealSequence indices are valid for each puzzle answer', () => {
    for (const p of seedData.puzzles) {
      const maxIdx = p.answer.length - 1;
      for (const i of p.revealSequence) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThanOrEqual(maxIdx);
      }
    }
  });

  it('seed-data can be loaded into the DB', async () => {
    for (const cat of seedData.categories) {
      await Category.create(cat);
    }
    for (const p of seedData.puzzles) {
      const category = await Category.findOne({ slug: p.categorySlug });
      const { categorySlug, ...puzzleFields } = p;
      await Puzzle.create({ ...puzzleFields, categoryId: category._id });
    }
    const catCount = await Category.countDocuments();
    const puzCount = await Puzzle.countDocuments();
    expect(catCount).toBe(seedData.categories.length);
    expect(puzCount).toBe(seedData.puzzles.length);
  });
});
```

Run: `cd server && npx jest tests/integration/seed-smoke.test.js` — expect 5/5 PASS.

- [ ] **Step 6: Run full suite**

`cd server && npm test` — expect all new tests + existing 42 still green.

- [ ] **Step 7: Commit**

```bash
git add server/src/seed/ server/package.json server/README.md server/tests/integration/seed-smoke.test.js
git commit -m "feat(server): seed script with starter categories and puzzles"
```

---

## Task 14: Update README with new endpoints + final suite run

**Files:**
- Modify: `server/README.md`

- [ ] **Step 1: Append endpoint rows to the existing table**

Add to the "Auth Endpoints" section (rename section to "API Endpoints"):
```markdown
| GET | /categories | — | — | List all categories |
| POST | /sessions/start | Bearer | `{ categorySlug? }` | Start a new game session; free users may not pass categorySlug |
| POST | /sessions/:id/hint | Bearer | — | Request next hint (penalty applied at scoring) |
| POST | /sessions/:id/guess | Bearer | `{ guess }` | Submit answer; server scores and finalizes |
| GET | /sessions/me | Bearer | — | Paginated list of your sessions |
| GET | /sessions/:id | Bearer | — | Single session detail (must be yours) |
```

Add a "Scoring" section:
```markdown
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
```

Add a "Plan Gating" section:
```markdown
## Plan Gating

- **Free plan:** `POST /sessions/start` with no body → random non-premium puzzle. Passing `categorySlug` returns 403.
- **Premium plan:** `POST /sessions/start` with or without `categorySlug` → any puzzle (premium + non-premium).
```

- [ ] **Step 2: Final suite run**

`cd server && npm test` — confirm everything green.

- [ ] **Step 3: Commit**

```bash
git add server/README.md
git commit -m "docs(server): document puzzle + session API in readme"
```

---

## Post-plan verification checklist

After all tasks complete:

- [ ] `cd server && npm test` — all tests pass (Plan 1's 42 + Plan 2's ~45 ≈ 87 tests)
- [ ] `cd server && npm run seed` works against a real local MongoDB
- [ ] `curl -H "Authorization: Bearer $T" http://localhost:4000/categories` returns category list
- [ ] A free user can POST /sessions/start with empty body and get a puzzle
- [ ] A free user POSTing /sessions/start with a categorySlug gets 403
- [ ] A correct guess returns a positive integer score
- [ ] Replaying a completed session returns 409

---

## Out of scope (for later plans)

- Frontend integration (Plan 3)
- Stripe + admin pricing (Plan 4)
- Admin panel CRUD (Plan 5)
- Leaderboards + ads + deploy (Plan 6)
- Streaks and achievements (consider in Plan 5 or 6)
