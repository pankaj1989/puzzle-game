# Leaderboards + Streaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three leaderboard windows (daily / weekly / all-time), a daily streak counter on the User model, and a shareable Wordle-style result string after a puzzle is solved.

**Architecture:** User model gains `currentStreak`, `longestStreak`, `lastPlayedDay`, `totalScore`. When a guess finalizes a session as solved, the guess controller calls `updateStreakAndScore` — a pure function that returns the next streak + totalScore delta — then writes to the user. A `leaderboardService` owns two functions: `getLeaderboard({ window })` and `getUserRank({ userId, window })`, each using MongoDB aggregations over `GameSession`. All-time is served from the denormalized `User.totalScore`. Share endpoint generates a short text block the client can copy. Frontend adds a `/leaderboards` page, a streak badge on the game-start header, and a share button on the result screen.

**Tech Stack:**
- Backend: existing Express 5 / Mongoose 9 / zod 4 stack. No new runtime deps.
- Frontend: existing React 19 / React Router 7 / Tailwind v4.
- Clipboard: browser `navigator.clipboard` API.

---

## File Structure

```
server/
├── src/
│   ├── models/User.js                              # MODIFY: 4 new fields
│   ├── services/
│   │   ├── streakService.js                        # NEW: pure streak update logic
│   │   ├── leaderboardService.js                   # NEW: aggregation + rank
│   │   └── shareService.js                         # NEW: result string builder
│   ├── controllers/
│   │   ├── sessionController.js                    # MODIFY: call streak update on solve + add getShareString
│   │   └── leaderboardController.js                # NEW
│   ├── routes/
│   │   ├── leaderboards.js                         # NEW
│   │   └── sessions.js                             # MODIFY: GET /:id/share route
│   └── app.js                                      # MODIFY: mount /leaderboards
└── tests/integration/
    ├── streak-service.test.js                      # NEW
    ├── leaderboard-service.test.js                 # NEW
    ├── leaderboard-endpoints.test.js               # NEW
    ├── share-service.test.js                       # NEW
    ├── sessions-share.test.js                      # NEW
    └── sessions-guess.test.js                      # MODIFY: add streak + totalScore assertions

src/
├── api/client.js                                   # (no change)
├── pages/
│   ├── LeaderboardsPage.jsx                        # NEW
│   ├── GameStart.jsx                               # MODIFY: show streak, link to leaderboards
│   └── GamePlay.jsx                                # MODIFY: ResultScreen adds share button
└── App.jsx                                         # MODIFY: add /leaderboards route
```

---

## API Contracts

| Method | Path | Auth | Query / Body | Response |
|---|---|---|---|---|
| GET | /leaderboards/:window | — | `:window` ∈ `day` \| `week` \| `all` | `{ entries: [{ rank, userId, displayName, score }] }` |
| GET | /leaderboards/me | Bearer | `?window=day|week|all` (default all) | `{ rank, score, window }` — `rank: null` if score is zero |
| GET | /sessions/:id/share | Bearer | — | `{ text }` |

Leaderboards return up to 50 entries. `displayName` falls back to anonymized email (first 2 chars + `***`).

---

## Conventions

- Backend TDD; frontend manual verification.
- 1 commit per task.
- Time boundaries use UTC for simplicity (no tz math).

---

## Task 1: User model — add streak + totalScore fields

**Files:**
- Modify: `server/src/models/User.js`
- Create: `server/tests/integration/user-streak-fields.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/user-streak-fields.test.js`:
```js
const { registerHooks } = require('../testSetup');
const User = require('../../src/models/User');

registerHooks();

describe('User streak + score fields', () => {
  it('defaults streak fields and totalScore to 0 / null', async () => {
    const u = await User.create({ email: 'a@b.com', passwordHash: 'x' });
    expect(u.currentStreak).toBe(0);
    expect(u.longestStreak).toBe(0);
    expect(u.lastPlayedDay).toBeNull();
    expect(u.totalScore).toBe(0);
  });

  it('persists non-zero values', async () => {
    const u = await User.create({
      email: 'a@b.com', passwordHash: 'x',
      currentStreak: 5, longestStreak: 10, totalScore: 1234,
      lastPlayedDay: new Date('2026-04-21'),
    });
    expect(u.currentStreak).toBe(5);
    expect(u.longestStreak).toBe(10);
    expect(u.totalScore).toBe(1234);
    expect(u.lastPlayedDay.toISOString().slice(0, 10)).toBe('2026-04-21');
  });
});
```

- [ ] **Step 2: Run — expect FAIL (undefined fields returning undefined, not 0/null)**

- [ ] **Step 3: Update `server/src/models/User.js`**

Add these fields to the `userSchema` object (inside the existing `new mongoose.Schema({...}` call, after the existing fields):
```js
currentStreak: { type: Number, default: 0, min: 0 },
longestStreak: { type: Number, default: 0, min: 0 },
lastPlayedDay: { type: Date, default: null },
totalScore: { type: Number, default: 0, min: 0, index: true },
```

- [ ] **Step 4: Run — expect PASS (2/2)**

- [ ] **Step 5: Commit**

```bash
git add server/src/models/User.js server/tests/integration/user-streak-fields.test.js
git commit -m "feat(server): add streak + totalScore fields to User"
```

---

## Task 2: Streak service (pure logic)

**Files:**
- Create: `server/src/services/streakService.js`
- Create: `server/tests/integration/streak-service.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/streak-service.test.js`:
```js
const { computeStreakUpdate, toUtcDay } = require('../../src/services/streakService');

function day(iso) { return new Date(iso + 'T10:00:00Z'); }

describe('toUtcDay', () => {
  it('strips time, normalizes to midnight UTC', () => {
    const d = toUtcDay(new Date('2026-04-21T15:30:00Z'));
    expect(d.toISOString()).toBe('2026-04-21T00:00:00.000Z');
  });
});

describe('computeStreakUpdate', () => {
  it('first play: streak 1, longest 1', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: null, currentStreak: 0, longestStreak: 0, now: day('2026-04-21'),
    });
    expect(r).toEqual({ currentStreak: 1, longestStreak: 1, lastPlayedDay: day('2026-04-21T00:00:00') });
    // (matcher cares about date, not time; see next assertion)
  });

  it('same day: no change to streak, dates unchanged', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-21'), currentStreak: 5, longestStreak: 10, now: day('2026-04-21'),
    });
    expect(r.currentStreak).toBe(5);
    expect(r.longestStreak).toBe(10);
  });

  it('next day: increments streak; longest advances if exceeded', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-21'), currentStreak: 5, longestStreak: 5, now: day('2026-04-22'),
    });
    expect(r.currentStreak).toBe(6);
    expect(r.longestStreak).toBe(6);
  });

  it('next day: does not lower longest', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-21'), currentStreak: 5, longestStreak: 20, now: day('2026-04-22'),
    });
    expect(r.currentStreak).toBe(6);
    expect(r.longestStreak).toBe(20);
  });

  it('gap: resets to 1', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-18'), currentStreak: 10, longestStreak: 10, now: day('2026-04-21'),
    });
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(10);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `server/src/services/streakService.js`**

```js
function toUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

const ONE_DAY_MS = 86_400_000;

function computeStreakUpdate({ lastPlayedDay, currentStreak, longestStreak, now }) {
  const today = toUtcDay(now);
  if (!lastPlayedDay) {
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), lastPlayedDay: today };
  }
  const last = toUtcDay(lastPlayedDay);
  const diffMs = today - last;

  if (diffMs === 0) {
    return { currentStreak, longestStreak, lastPlayedDay: last };
  }
  if (diffMs === ONE_DAY_MS) {
    const next = currentStreak + 1;
    return { currentStreak: next, longestStreak: Math.max(longestStreak, next), lastPlayedDay: today };
  }
  return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), lastPlayedDay: today };
}

module.exports = { computeStreakUpdate, toUtcDay };
```

- [ ] **Step 4: Run — expect PASS (6/6)**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/streakService.js server/tests/integration/streak-service.test.js
git commit -m "feat(server): pure streakService.computeStreakUpdate"
```

---

## Task 3: Wire streak + totalScore update into submitGuess

**Files:**
- Modify: `server/src/controllers/sessionController.js`
- Modify: `server/tests/integration/sessions-guess.test.js`

- [ ] **Step 1: Extend the existing guess test file**

At the bottom of `server/tests/integration/sessions-guess.test.js` (do not remove existing tests), add:
```js
describe('streak + totalScore updates', () => {
  it('first solve increments currentStreak to 1 and adds score to totalScore', async () => {
    const { session, user } = await seed();
    await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'love tomorrow' });
    const User = require('../../src/models/User');
    const fresh = await User.findById(user._id);
    expect(fresh.currentStreak).toBe(1);
    expect(fresh.longestStreak).toBe(1);
    expect(fresh.totalScore).toBeGreaterThan(0);
    expect(fresh.lastPlayedDay).not.toBeNull();
  });

  it('wrong guess does not touch streak', async () => {
    const { session, user } = await seed();
    await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'nope' });
    const User = require('../../src/models/User');
    const fresh = await User.findById(user._id);
    expect(fresh.currentStreak).toBe(0);
    expect(fresh.totalScore).toBe(0);
  });
});
```

The `seed()` helper and `app()` / `authHeader` / `request` / `registerHooks` are already imported at the top of the file from earlier tests — do not re-import.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Update `submitGuess` in `server/src/controllers/sessionController.js`**

At the top of the file, add:
```js
const { computeStreakUpdate } = require('../services/streakService');
```

Find `submitGuess`. After the `session.save()` that finalizes (inside the `if (correct)` branch, after `session.finalGuess = normalizedGuess; await session.save();`), add:
```js
  // Update streak + totalScore on the user
  const streakUpdate = computeStreakUpdate({
    lastPlayedDay: req.user.lastPlayedDay,
    currentStreak: req.user.currentStreak,
    longestStreak: req.user.longestStreak,
    now: new Date(),
  });
  req.user.currentStreak = streakUpdate.currentStreak;
  req.user.longestStreak = streakUpdate.longestStreak;
  req.user.lastPlayedDay = streakUpdate.lastPlayedDay;
  req.user.totalScore = (req.user.totalScore || 0) + score;
  await req.user.save();
```

Position it AFTER session is saved, BEFORE `res.json(...)`.

- [ ] **Step 4: Run — expect PASS (2 new + existing tests unchanged)**

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/sessionController.js server/tests/integration/sessions-guess.test.js
git commit -m "feat(server): update user streak and totalScore when session is solved"
```

---

## Task 4: Leaderboard service

**Files:**
- Create: `server/src/services/leaderboardService.js`
- Create: `server/tests/integration/leaderboard-service.test.js`

- [ ] **Step 1: Write failing test**

`server/tests/integration/leaderboard-service.test.js`:
```js
const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const User = require('../../src/models/User');
const Puzzle = require('../../src/models/Puzzle');
const Category = require('../../src/models/Category');
const GameSession = require('../../src/models/GameSession');
const { getLeaderboard, getUserRank } = require('../../src/services/leaderboardService');

registerHooks();

async function seedBase() {
  const cat = await Category.create({ slug: 'movies', name: 'Movies' });
  const p = await Puzzle.create({
    plate: 'X', answer: 'x', categoryId: cat._id,
    difficulty: 'easy', clue: 'x', revealSequence: [0],
  });
  return p;
}

async function seedSolvedSession({ user, puzzle, score, when }) {
  return GameSession.create({
    userId: user._id, puzzleId: puzzle._id,
    solved: true, score, completedAt: when, startedAt: when, finalGuess: 'x',
  });
}

describe('leaderboardService.getLeaderboard', () => {
  it('all-time ranks by User.totalScore, highest first', async () => {
    await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A', totalScore: 50 });
    await User.create({ email: 'b@x.com', passwordHash: 'x', displayName: 'B', totalScore: 200 });
    await User.create({ email: 'c@x.com', passwordHash: 'x', displayName: 'C', totalScore: 0 });
    const rows = await getLeaderboard({ window: 'all' });
    expect(rows[0].displayName).toBe('B');
    expect(rows[0].score).toBe(200);
    expect(rows[1].displayName).toBe('A');
    expect(rows.find(r => r.displayName === 'C')).toBeUndefined(); // excluded zero scores
  });

  it('daily aggregates solved sessions completed today', async () => {
    const u1 = await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A' });
    const u2 = await User.create({ email: 'b@x.com', passwordHash: 'x', displayName: 'B' });
    const p = await seedBase();
    const now = new Date();
    await seedSolvedSession({ user: u1, puzzle: p, score: 30, when: now });
    await seedSolvedSession({ user: u1, puzzle: p, score: 40, when: now });
    await seedSolvedSession({ user: u2, puzzle: p, score: 100, when: now });
    // Yesterday — must not count
    const yesterday = new Date(Date.now() - 2 * 86_400_000);
    await seedSolvedSession({ user: u1, puzzle: p, score: 9999, when: yesterday });

    const rows = await getLeaderboard({ window: 'day' });
    expect(rows[0].displayName).toBe('B');
    expect(rows[0].score).toBe(100);
    expect(rows[1].displayName).toBe('A');
    expect(rows[1].score).toBe(70);
  });

  it('weekly aggregates last 7 days', async () => {
    const u = await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A' });
    const p = await seedBase();
    await seedSolvedSession({ user: u, puzzle: p, score: 50, when: new Date() });
    await seedSolvedSession({ user: u, puzzle: p, score: 30, when: new Date(Date.now() - 3 * 86_400_000) });
    // 10 days ago — must not count
    await seedSolvedSession({ user: u, puzzle: p, score: 9999, when: new Date(Date.now() - 10 * 86_400_000) });
    const rows = await getLeaderboard({ window: 'week' });
    expect(rows[0].score).toBe(80);
  });

  it('falls back to anonymized email when no displayName', async () => {
    await User.create({ email: 'longlong@x.com', passwordHash: 'x', totalScore: 100 });
    const [row] = await getLeaderboard({ window: 'all' });
    expect(row.displayName).toBe('lo***');
  });
});

describe('leaderboardService.getUserRank', () => {
  it('returns null rank when user has no score', async () => {
    const u = await User.create({ email: 'a@x.com', passwordHash: 'x' });
    const r = await getUserRank({ userId: u._id, window: 'all' });
    expect(r).toEqual({ rank: null, score: 0, window: 'all' });
  });

  it('returns correct all-time rank and score', async () => {
    await User.create({ email: 'a@x.com', passwordHash: 'x', totalScore: 1000 });
    const me = await User.create({ email: 'me@x.com', passwordHash: 'x', totalScore: 500 });
    await User.create({ email: 'c@x.com', passwordHash: 'x', totalScore: 100 });
    const r = await getUserRank({ userId: me._id, window: 'all' });
    expect(r).toEqual({ rank: 2, score: 500, window: 'all' });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `server/src/services/leaderboardService.js`**

```js
const User = require('../models/User');
const GameSession = require('../models/GameSession');

function anonymize(email) {
  if (!email) return 'anonymous';
  return email.slice(0, 2) + '***';
}

function windowFilter(window) {
  if (window === 'day') {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return { completedAt: { $gte: start }, solved: true };
  }
  if (window === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    return { completedAt: { $gte: weekAgo }, solved: true };
  }
  return null;
}

async function getLeaderboard({ window, limit = 50 }) {
  if (window === 'all') {
    const users = await User.find({ totalScore: { $gt: 0 } })
      .sort({ totalScore: -1 })
      .limit(limit);
    return users.map((u, i) => ({
      rank: i + 1,
      userId: u._id,
      displayName: u.displayName || anonymize(u.email),
      score: u.totalScore,
    }));
  }
  const filter = windowFilter(window);
  if (!filter) return [];
  const rows = await GameSession.aggregate([
    { $match: filter },
    { $group: { _id: '$userId', score: { $sum: '$score' } } },
    { $sort: { score: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
  ]);
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r._id,
    displayName: r.user.displayName || anonymize(r.user.email),
    score: r.score,
  }));
}

async function getUserRank({ userId, window }) {
  if (window === 'all') {
    const me = await User.findById(userId);
    const score = me?.totalScore || 0;
    if (score === 0) return { rank: null, score: 0, window };
    const ahead = await User.countDocuments({ totalScore: { $gt: score } });
    return { rank: ahead + 1, score, window };
  }
  const filter = windowFilter(window);
  if (!filter) return { rank: null, score: 0, window };
  const agg = await GameSession.aggregate([
    { $match: filter },
    { $group: { _id: '$userId', score: { $sum: '$score' } } },
  ]);
  const mine = agg.find(r => r._id.toString() === userId.toString());
  if (!mine || mine.score === 0) return { rank: null, score: 0, window };
  const ahead = agg.filter(r => r.score > mine.score).length;
  return { rank: ahead + 1, score: mine.score, window };
}

module.exports = { getLeaderboard, getUserRank };
```

- [ ] **Step 4: Run — expect PASS (6/6)**

- [ ] **Step 5: Commit**

```bash
git add server/src/services/leaderboardService.js server/tests/integration/leaderboard-service.test.js
git commit -m "feat(server): leaderboardService with daily/weekly/all-time + getUserRank"
```

---

## Task 5: Leaderboard endpoints

**Files:**
- Create: `server/src/controllers/leaderboardController.js`
- Create: `server/src/routes/leaderboards.js`
- Modify: `server/src/app.js` (mount)
- Create: `server/tests/integration/leaderboard-endpoints.test.js`

- [ ] **Step 1: Failing test**

`server/tests/integration/leaderboard-endpoints.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

describe('GET /leaderboards/:window', () => {
  beforeEach(async () => {
    await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A', totalScore: 200 });
    await User.create({ email: 'b@x.com', passwordHash: 'x', displayName: 'B', totalScore: 100 });
  });

  it('returns all-time entries', async () => {
    const res = await request(app()).get('/leaderboards/all');
    expect(res.status).toBe(200);
    expect(res.body.entries).toHaveLength(2);
    expect(res.body.entries[0].displayName).toBe('A');
  });

  it('returns day entries (empty when no sessions)', async () => {
    const res = await request(app()).get('/leaderboards/day');
    expect(res.status).toBe(200);
    expect(res.body.entries).toEqual([]);
  });

  it('rejects unknown window with 400', async () => {
    const res = await request(app()).get('/leaderboards/bogus');
    expect(res.status).toBe(400);
  });
});

describe('GET /leaderboards/me', () => {
  it('401 without token', async () => {
    const res = await request(app()).get('/leaderboards/me');
    expect(res.status).toBe(401);
  });

  it('returns rank + score for authed user', async () => {
    const user = await createUser({ email: 'me@x.com' });
    user.totalScore = 150;
    await user.save();
    await User.create({ email: 'a@x.com', passwordHash: 'x', totalScore: 200 });
    const res = await request(app()).get('/leaderboards/me?window=all').set(authHeader(user));
    expect(res.body).toEqual({ rank: 2, score: 150, window: 'all' });
  });

  it('defaults window to all when absent', async () => {
    const user = await createUser({ email: 'me@x.com' });
    user.totalScore = 50;
    await user.save();
    const res = await request(app()).get('/leaderboards/me').set(authHeader(user));
    expect(res.body.window).toBe('all');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Controller — `server/src/controllers/leaderboardController.js`**

```js
const { getLeaderboard, getUserRank } = require('../services/leaderboardService');
const { HttpError } = require('../middleware/errorHandler');

const WINDOWS = ['day', 'week', 'all'];

async function list(req, res) {
  const { window } = req.params;
  if (!WINDOWS.includes(window)) throw new HttpError(400, 'Invalid window', 'INVALID_WINDOW');
  const entries = await getLeaderboard({ window });
  res.json({ entries });
}

async function me(req, res) {
  const window = WINDOWS.includes(req.query.window) ? req.query.window : 'all';
  const result = await getUserRank({ userId: req.user._id, window });
  res.json(result);
}

module.exports = { list, me };
```

- [ ] **Step 4: Route — `server/src/routes/leaderboards.js`**

```js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/leaderboardController');

// /me MUST be declared before /:window — otherwise :window captures "me"
router.get('/me', authRequired(), asyncHandler(controller.me));
router.get('/:window', asyncHandler(controller.list));

module.exports = router;
```

- [ ] **Step 5: Mount in `server/src/app.js`**

```js
const leaderboardRoutes = require('./routes/leaderboards');
// ...
app.use('/leaderboards', leaderboardRoutes);
```

- [ ] **Step 6: Run — expect PASS (6/6)**

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/leaderboardController.js server/src/routes/leaderboards.js server/src/app.js server/tests/integration/leaderboard-endpoints.test.js
git commit -m "feat(server): GET /leaderboards/:window and /leaderboards/me"
```

---

## Task 6: Share service + endpoint

**Files:**
- Create: `server/src/services/shareService.js`
- Modify: `server/src/controllers/sessionController.js`
- Modify: `server/src/routes/sessions.js`
- Create: `server/tests/integration/share-service.test.js`
- Create: `server/tests/integration/sessions-share.test.js`

- [ ] **Step 1: Failing tests**

`server/tests/integration/share-service.test.js`:
```js
const { buildShareText } = require('../../src/services/shareService');

describe('buildShareText', () => {
  it('produces a short block with plate, score, hints, wrong guesses', () => {
    const text = buildShareText({
      plate: 'STRW4R', score: 145, hintsUsed: 1, wrongGuesses: 2,
    });
    expect(text).toContain('Bumper Stumpers');
    expect(text).toContain('STRW4R');
    expect(text).toContain('145');
    expect(text).toContain('🟩'); // solved marker
  });

  it('uses different grid for unsolved (score=0)', () => {
    const text = buildShareText({
      plate: 'X', score: 0, hintsUsed: 0, wrongGuesses: 3,
    });
    expect(text).toContain('⬜');
    expect(text).not.toContain('🟩');
  });
});
```

`server/tests/integration/sessions-share.test.js`:
```js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');
const mongoose = require('mongoose');

registerHooks();
const app = () => getApp();

async function solved() {
  const cat = await Category.create({ slug: 'm', name: 'M' });
  const p = await Puzzle.create({
    plate: 'ABC', answer: 'abc', categoryId: cat._id,
    difficulty: 'easy', clue: 'x', revealSequence: [0],
  });
  const user = await createUser();
  const session = await GameSession.create({
    userId: user._id, puzzleId: p._id,
    solved: true, score: 42, hintsUsed: 1, wrongGuesses: 2,
    completedAt: new Date(), finalGuess: 'abc',
  });
  return { user, session, p };
}

describe('GET /sessions/:id/share', () => {
  it('returns text for solved session', async () => {
    const { user, session } = await solved();
    const res = await request(app()).get(`/sessions/${session._id}/share`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.text).toContain('ABC');
    expect(res.body.text).toContain('42');
  });

  it('403 if session belongs to someone else', async () => {
    const { session } = await solved();
    const other = await createUser({ email: 'other@x.com' });
    const res = await request(app()).get(`/sessions/${session._id}/share`).set(authHeader(other));
    expect(res.status).toBe(403);
  });

  it('404 on unknown id', async () => {
    const user = await createUser();
    const fake = new mongoose.Types.ObjectId();
    const res = await request(app()).get(`/sessions/${fake}/share`).set(authHeader(user));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `server/src/services/shareService.js`**

```js
function buildShareText({ plate, score, hintsUsed, wrongGuesses }) {
  const solved = score > 0;
  const wrongRow = '⬜'.repeat(Math.max(0, wrongGuesses));
  const solvedRow = solved ? '🟩🟩🟩🟩🟩' : '';
  const outcomeLine = solved
    ? `${wrongRow}${solvedRow}`
    : (wrongRow || '⬜');
  return [
    'Bumper Stumpers',
    `Plate: ${plate}`,
    outcomeLine,
    `Hints: ${hintsUsed} · Wrong: ${wrongGuesses} · Score: ${score}`,
  ].join('\n');
}

module.exports = { buildShareText };
```

- [ ] **Step 4: Add controller + route**

In `server/src/controllers/sessionController.js`, add imports and handler:
```js
const { buildShareText } = require('../services/shareService');

async function getShare(req, res) {
  const idCheck = mongoIdSchema.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid session id', 'INVALID_ID');
  const session = await GameSession.findById(req.params.id);
  if (!session) throw new HttpError(404, 'Session not found', 'NOT_FOUND');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }
  const puzzle = await Puzzle.findById(session.puzzleId);
  if (!puzzle) throw new HttpError(404, 'Puzzle not found', 'NOT_FOUND');
  const text = buildShareText({
    plate: puzzle.plate,
    score: session.score || 0,
    hintsUsed: session.hintsUsed,
    wrongGuesses: session.wrongGuesses,
  });
  res.json({ text });
}

module.exports = { startSession, submitGuess, requestHint, listMySessions, getSession, getShare, serializeSession, serializePuzzle };
```

In `server/src/routes/sessions.js`, add:
```js
router.get('/:id/share', authRequired(), asyncHandler(controller.getShare));
```

Place it BEFORE `router.get('/:id', ...)` in the router to avoid collision with the generic `:id` route.

- [ ] **Step 5: Run — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add server/src/services/shareService.js server/src/controllers/sessionController.js server/src/routes/sessions.js server/tests/integration/share-service.test.js server/tests/integration/sessions-share.test.js
git commit -m "feat(server): shareable result text + GET /sessions/:id/share"
```

---

## Task 7: Frontend — Leaderboards page

**Files:**
- Create: `src/pages/LeaderboardsPage.jsx`
- Modify: `src/App.jsx` (add route)

- [ ] **Step 1: Create page**

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const TABS = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'all', label: 'All time' },
];

export function LeaderboardsPage() {
  const { user } = useAuth();
  const [window, setWindow] = useState('all');
  const [entries, setEntries] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get(`/leaderboards/${window}`),
      user ? api.get(`/leaderboards/me?window=${window}`) : Promise.resolve(null),
    ])
      .then(([list, me]) => {
        if (!active) return;
        setEntries(list.entries);
        setMyRank(me);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [window, user]);

  return (
    <div className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif text-navy">Leaderboards</h1>
        <Link to="/game-start" className="text-sm text-brand-orange-dark underline">Back to game</Link>
      </header>

      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setWindow(t.key)}
            className={`py-2 px-4 rounded-lg border ${
              window === t.key ? 'navy-gradient text-cream border-brand-orange' : 'bg-white border-card-gray2 text-navy'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {myRank && (
        <div className="mb-4 p-3 bg-cream/60 border border-card-yellow rounded-lg text-sm text-navy">
          Your rank: <strong>{myRank.rank ?? '—'}</strong> · Score: <strong>{myRank.score}</strong>
        </div>
      )}

      {loading && <div>Loading…</div>}
      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      {!loading && entries.length === 0 && (
        <div className="text-text-muted2">No entries yet for this window. Go solve a puzzle!</div>
      )}

      {!loading && entries.length > 0 && (
        <table className="w-full bg-white rounded-xl border border-card-gray2">
          <thead className="text-left text-xs uppercase text-text-muted2">
            <tr><th className="p-3 w-16">#</th><th className="p-3">Player</th><th className="p-3 text-right">Score</th></tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.userId} className="border-t border-card-gray2">
                <td className="p-3 font-bold text-navy">{e.rank}</td>
                <td className="p-3">{e.displayName}</td>
                <td className="p-3 text-right font-mono">{e.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add route to `src/App.jsx`**

Add import:
```jsx
import { LeaderboardsPage } from './pages/LeaderboardsPage';
```

Add a public route (no auth required — anyone can see leaderboards, signed-in users also get `/me` rank):
```jsx
<Route path="/leaderboards" element={<LeaderboardsPage />} />
```

Put it near the other public routes (e.g. after `/signup`, `/login`).

- [ ] **Step 3: Manual verification**

Visit `/leaderboards` — see tab switcher (Today / This week / All time), empty state when no data, populated when users have totalScore. Switch tabs — data reloads.

- [ ] **Step 4: Commit**

```bash
git add src/pages/LeaderboardsPage.jsx src/App.jsx
git commit -m "feat(frontend): /leaderboards page with daily/weekly/all-time tabs"
```

---

## Task 8: Frontend — streak display on GameStart header + leaderboards link

**Files:**
- Modify: `src/pages/GameStart.jsx`

- [ ] **Step 1: Add streak badge + leaderboards link to header**

Find the existing header block in `src/pages/GameStart.jsx`:
```jsx
<header className="flex justify-between items-center mb-8 flex-wrap gap-3">
  <h1 className="text-3xl font-serif text-navy">Choose your game</h1>
  <div className="text-sm text-text-muted">
    Signed in as <strong>{user?.email}</strong>{' '}
    <button onClick={logout} className="ml-2 text-brand-orange-dark underline">
      Sign out
    </button>
  </div>
</header>
```

Add a streak badge + leaderboards link alongside the right-side controls. Also add `Link` import at the top if not already present (`import { Link, useNavigate } from 'react-router-dom';`).

Replace the header block with:
```jsx
<header className="flex justify-between items-center mb-8 flex-wrap gap-3">
  <h1 className="text-3xl font-serif text-navy">Choose your game</h1>
  <div className="flex items-center gap-3 text-sm text-text-muted flex-wrap">
    {user?.currentStreak > 0 && (
      <span className="px-3 py-1 rounded-full bg-brand-orange/10 border border-brand-orange text-brand-orange-dark font-semibold">
        🔥 {user.currentStreak}-day streak
      </span>
    )}
    <Link to="/leaderboards" className="underline text-navy">Leaderboards</Link>
    <span>
      Signed in as <strong>{user?.email}</strong>{' '}
      <button onClick={logout} className="ml-2 text-brand-orange-dark underline">
        Sign out
      </button>
    </span>
  </div>
</header>
```

- [ ] **Step 2: Manual verification**

Solve a puzzle. Return to `/game-start`. Streak badge appears with `🔥 1-day streak`. Leaderboards link is visible and works.

Note: the `user` object comes from `useAuth()`. After the session is solved, `user.currentStreak` won't reflect until the user is re-hydrated. To force this, do a full page reload (F5) after solving — `AuthContext` hydrates from `/auth/me` on mount. A follow-up task (out of scope for this plan) could refresh the user in AuthContext after gameplay events.

- [ ] **Step 3: Commit**

```bash
git add src/pages/GameStart.jsx
git commit -m "feat(frontend): streak badge + leaderboards link on GameStart"
```

---

## Task 9: Frontend — Share button on result screen

**Files:**
- Modify: `src/pages/GamePlay.jsx`

- [ ] **Step 1: Add share state + handler in ResultScreen**

Find the `ResultScreen` component inside `src/pages/GamePlay.jsx`. Replace it with:

```jsx
function ResultScreen({ result, puzzle, session, onPlayAgain }) {
  const [shareText, setShareText] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(null);

  async function loadShare() {
    setShareError(null);
    try {
      const { text } = await api.get(`/sessions/${session.id}/share`);
      setShareText(text);
    } catch (err) {
      setShareError(err.message);
    }
  }

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError('Copy failed — you can select the text manually');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-4xl font-serif text-navy mb-3">
          {result.solved ? 'Solved!' : 'Out of time'}
        </h1>
        {result.solved && (
          <div className="text-6xl font-bold text-brand-orange-dark mb-6">+{result.score}</div>
        )}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-card-gray2 mb-6">
          <div className="text-sm uppercase tracking-wide text-text-muted2">Plate</div>
          <div
            className="text-3xl font-bold tracking-widest text-navy-dark mb-3"
            style={{ fontFamily: 'Alumni Sans, sans-serif' }}
          >
            {puzzle.plate}
          </div>
          <div className="text-sm uppercase tracking-wide text-text-muted2">Answer</div>
          <div className="text-2xl text-navy mb-3">{result.correctAnswer || '—'}</div>
          <div className="text-xs text-text-muted2">
            Hints: {session.hintsUsed} · Wrong guesses: {session.wrongGuesses}
          </div>
        </div>

        {shareText ? (
          <div className="mb-6 bg-white rounded-xl border border-card-gray2 p-4">
            <pre className="whitespace-pre-wrap text-left text-navy mb-3 font-mono text-sm">{shareText}</pre>
            <button onClick={copyShare} className="py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            onClick={loadShare}
            className="mb-6 py-2 px-4 rounded-lg border-2 border-navy text-navy font-semibold bg-white hover:bg-cream"
          >
            Share result
          </button>
        )}

        {shareError && (
          <div className="mb-6 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {shareError}
          </div>
        )}

        <button
          onClick={onPlayAgain}
          className="py-3 px-8 rounded-lg navy-gradient text-cream font-semibold border-2 border-brand-orange"
        >
          Play again
        </button>
      </div>
    </div>
  );
}
```

Note: this adds `useState` calls inside `ResultScreen`. `useState` is already imported at the top of `GamePlay.jsx` (used by the outer component). The `api` import is also already there.

- [ ] **Step 2: Manual verification**

Solve a puzzle. On the result screen click **Share result** — text appears (e.g. `Bumper Stumpers\nPlate: STRW4R\n⬜⬜🟩🟩🟩🟩🟩\nHints: 0 · Wrong: 2 · Score: 145`). Click **Copy** — button flips to "Copied!". Paste elsewhere to confirm.

- [ ] **Step 3: Commit**

```bash
git add src/pages/GamePlay.jsx
git commit -m "feat(frontend): share button on result screen with clipboard copy"
```

---

## Task 10: README + full suite run

**Files:**
- Modify: `server/README.md`

- [ ] **Step 1: Append a "Leaderboards + Streaks" section**

After the existing "Admin panel" section:
```markdown
## Leaderboards + Streaks

Users accumulate a daily `currentStreak` (consecutive days with at least one solved puzzle). Missing a day resets the streak to 1 on next solve. `longestStreak` never decreases. `totalScore` is a denormalized counter incremented on every solved session.

Public endpoints (no auth required):
- `GET /leaderboards/day` — sum of scores from sessions completed today (UTC)
- `GET /leaderboards/week` — sum from the last 7 days
- `GET /leaderboards/all` — ranked by `User.totalScore`

Authed endpoints:
- `GET /leaderboards/me?window=day|week|all` — your rank and score

Sharing:
- `GET /sessions/:id/share` — returns a short text block the client can copy to clipboard
```

Also add rows to the endpoint table:
```markdown
| GET | /leaderboards/day | — | — | Daily leaderboard |
| GET | /leaderboards/week | — | — | Weekly leaderboard |
| GET | /leaderboards/all | — | — | All-time leaderboard |
| GET | /leaderboards/me | Bearer | `?window=day|week|all` | Your rank + score |
| GET | /sessions/:id/share | Bearer | — | Shareable result text |
```

- [ ] **Step 2: Run full suite**

```bash
cd server && npm test
```
Expected: **all tests pass**. Rough count: 155 baseline + new:
- user-streak-fields (2) + streak-service (6) + sessions-guess additions (2) + leaderboard-service (6) + leaderboard-endpoints (6) + share-service (2) + sessions-share (3) = **27 new**
- Expect ~182 total.

- [ ] **Step 3: Commit**

```bash
git add server/README.md
git commit -m "docs: leaderboards + streaks + share endpoint"
```

---

## Post-plan verification checklist

- [ ] `cd server && npm test` — all tests pass (~182)
- [ ] Solve a puzzle → result screen shows score; `/auth/me` shows `currentStreak: 1`, `totalScore > 0`
- [ ] Solve again next day → streak increments to 2
- [ ] Skip a day → next solve resets streak to 1
- [ ] `/leaderboards` page renders tabs; all-time shows populated users; day/week populate after solving
- [ ] `/leaderboards/me` returns correct rank
- [ ] Share button returns a readable text block; copy-to-clipboard works
- [ ] GameStart header shows `🔥 N-day streak` after F5 reload

---

## Out of scope

- Realtime leaderboard updates (require WebSockets or SSE — polling the endpoint is fine for now)
- Achievements / badges
- Shareable images (text-only for now)
- Per-category leaderboards
- AuthContext refresh after session completion (workaround: F5)
- Ads / Google Sign-In (Plan 7)
- Deployment (Plan 8)
