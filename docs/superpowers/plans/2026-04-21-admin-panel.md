# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a role-gated `/admin` area in the existing React app that lets admins CRUD puzzles, categories, users, and pricing without curl, and see at-a-glance stats. Backend exposes a parallel `/admin/*` API surface; frontend routes sit alongside existing game routes with a dedicated layout.

**Architecture:** All admin backend routes live under `/admin/<resource>` and use the existing `authRequired({ roles: ['admin'] })` middleware. Admin UI uses React Router nested routes under `/admin` with a shared `AdminLayout` sidebar. Protection is a thin `AdminRoute` wrapper that redirects non-admin users to `/game-start`. No new runtime deps.

**Tech Stack:**
- Backend: Express 5, Mongoose 9, zod 4 (existing)
- Frontend: React 19, React Router 7, Tailwind v4 (existing)
- Testing: Jest + Supertest (backend TDD); manual verification on frontend

---

## File Structure

```
server/
├── src/
│   ├── validators/
│   │   ├── adminCategoryValidators.js        # NEW
│   │   ├── adminPuzzleValidators.js          # NEW
│   │   └── adminUserValidators.js            # NEW
│   ├── controllers/
│   │   ├── adminCategoryController.js        # NEW
│   │   ├── adminPuzzleController.js          # NEW
│   │   ├── adminUserController.js            # NEW
│   │   ├── adminStatsController.js           # NEW
│   │   └── pricingController.js              # MODIFY: add listPricing
│   ├── routes/
│   │   ├── adminCategories.js                # NEW
│   │   ├── adminPuzzles.js                   # NEW
│   │   ├── adminUsers.js                     # NEW
│   │   ├── adminStats.js                     # NEW
│   │   └── pricing.js                        # MODIFY: add GET /admin/pricing
│   └── app.js                                # MODIFY: mount new routers
└── tests/integration/
    ├── admin-categories.test.js              # NEW
    ├── admin-puzzles.test.js                 # NEW
    ├── admin-users.test.js                   # NEW
    ├── admin-stats.test.js                   # NEW
    └── admin-pricing-list.test.js            # NEW

src/
├── admin/
│   ├── AdminRoute.jsx                        # NEW: role=admin guard
│   ├── AdminLayout.jsx                       # NEW: sidebar + outlet
│   └── api.js                                # NEW: thin wrappers over admin endpoints
├── pages/admin/
│   ├── DashboardPage.jsx                     # NEW
│   ├── CategoriesPage.jsx                    # NEW
│   ├── PuzzlesPage.jsx                       # NEW
│   ├── UsersPage.jsx                         # NEW
│   └── PricingPage.jsx                       # NEW
└── App.jsx                                   # MODIFY: add /admin routes
```

---

## API Contracts

All endpoints below require `Authorization: Bearer <admin accessToken>` — the existing `authRequired({ roles: ['admin'] })` middleware returns 401 without token and 403 for non-admins.

### Categories

| Method | Path | Body | Response |
|---|---|---|---|
| GET | /admin/categories | — | `{ categories: [...] }` (all; public already has same — this is auth-gated mirror) |
| POST | /admin/categories | `{ slug, name, icon?, isPremium? }` | 201 `{ category }` |
| PATCH | /admin/categories/:id | `{ name?, icon?, isPremium? }` | `{ category }` |
| DELETE | /admin/categories/:id | — | 204, fails with 409 if puzzles exist in it |

### Puzzles

| Method | Path | Body | Response |
|---|---|---|---|
| GET | /admin/puzzles | query: `page`, `limit`, `categorySlug?` | `{ puzzles, total, page, limit }` |
| GET | /admin/puzzles/:id | — | `{ puzzle }` (includes answer — admin only) |
| POST | /admin/puzzles | `{ plate, answer, categoryId, difficulty, clue, revealSequence, basePoints?, timeLimitSeconds?, isPremium? }` | 201 `{ puzzle }` |
| PATCH | /admin/puzzles/:id | any subset of above | `{ puzzle }` |
| DELETE | /admin/puzzles/:id | — | 204 |

### Users

| Method | Path | Body | Response |
|---|---|---|---|
| GET | /admin/users | query: `page`, `limit`, `q` (email substring) | `{ users, total, page, limit }` |
| PATCH | /admin/users/:id | `{ role?, plan? }` | `{ user }` |

### Stats

| Method | Path | Response |
|---|---|---|
| GET | /admin/stats | `{ users: { total, premium }, puzzles: { total, premium }, sessions: { total, solved, last7Days }, subscriptions: { active, canceled } }` |

### Pricing history

| Method | Path | Response |
|---|---|---|
| GET | /admin/pricing | `{ pricing: [...] }` (full history, newest first) |

---

## Conventions

- Backend tasks TDD.
- Frontend tasks have manual verification (no frontend test infra).
- 1 commit per task.

---

## Task 1: Admin categories CRUD

**Files:**
- Create: `server/src/validators/adminCategoryValidators.js`
- Create: `server/src/controllers/adminCategoryController.js`
- Create: `server/src/routes/adminCategories.js`
- Modify: `server/src/app.js` (mount)
- Create: `server/tests/integration/admin-categories.test.js`

- [ ] **Step 1: Validators**

```js
// server/src/validators/adminCategoryValidators.js
const { z } = require('zod');

const slugSchema = z.string().min(1).max(40).regex(/^[a-z0-9-]+$/);

const createCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(60),
  icon: z.string().max(200).optional(),
  isPremium: z.boolean().optional(),
}).strict();

const updateCategorySchema = z.object({
  name: z.string().min(1).max(60).optional(),
  icon: z.string().max(200).nullable().optional(),
  isPremium: z.boolean().optional(),
}).strict();

module.exports = { createCategorySchema, updateCategorySchema };
```

- [ ] **Step 2: Write failing test**

```js
// server/tests/integration/admin-categories.test.js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');

registerHooks();
const app = () => getApp();

async function admin() {
  return createUser({ email: 'admin@test.com', role: 'admin' });
}

describe('admin categories CRUD', () => {
  it('GET /admin/categories lists all (admin)', async () => {
    await Category.create({ slug: 'movies', name: 'Movies' });
    await Category.create({ slug: 'music', name: 'Music', isPremium: true });
    const res = await request(app()).get('/admin/categories').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(2);
  });

  it('POST /admin/categories creates', async () => {
    const res = await request(app()).post('/admin/categories').set(authHeader(await admin()))
      .send({ slug: 'music', name: 'Music', isPremium: true });
    expect(res.status).toBe(201);
    expect(res.body.category.slug).toBe('music');
  });

  it('POST rejects duplicate slug with 409', async () => {
    await Category.create({ slug: 'music', name: 'Music' });
    const res = await request(app()).post('/admin/categories').set(authHeader(await admin()))
      .send({ slug: 'music', name: 'Another' });
    expect(res.status).toBe(409);
  });

  it('PATCH /admin/categories/:id updates name', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    const res = await request(app()).patch(`/admin/categories/${cat._id}`).set(authHeader(await admin()))
      .send({ name: 'Cinema' });
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe('Cinema');
  });

  it('DELETE /admin/categories/:id deletes empty category', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    const res = await request(app()).delete(`/admin/categories/${cat._id}`).set(authHeader(await admin()));
    expect(res.status).toBe(204);
    expect(await Category.findById(cat._id)).toBeNull();
  });

  it('DELETE returns 409 when category has puzzles', async () => {
    const cat = await Category.create({ slug: 'movies', name: 'Movies' });
    await Puzzle.create({
      plate: 'X', answer: 'x', categoryId: cat._id, difficulty: 'easy',
      clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).delete(`/admin/categories/${cat._id}`).set(authHeader(await admin()));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_HAS_PUZZLES');
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'user@test.com' });
    const res = await request(app()).get('/admin/categories').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Controller**

```js
// server/src/controllers/adminCategoryController.js
const Category = require('../models/Category');
const Puzzle = require('../models/Puzzle');
const { HttpError } = require('../middleware/errorHandler');

async function list(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
}

async function create(req, res) {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ category });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Slug already exists', 'CATEGORY_EXISTS');
    throw err;
  }
}

async function update(req, res) {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  Object.assign(cat, req.body);
  await cat.save();
  res.json({ category: cat });
}

async function remove(req, res) {
  const hasPuzzles = await Puzzle.exists({ categoryId: req.params.id });
  if (hasPuzzles) throw new HttpError(409, 'Category has puzzles', 'CATEGORY_HAS_PUZZLES');
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.status(204).end();
}

module.exports = { list, create, update, remove };
```

- [ ] **Step 5: Route**

```js
// server/src/routes/adminCategories.js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { createCategorySchema, updateCategorySchema } = require('../validators/adminCategoryValidators');
const controller = require('../controllers/adminCategoryController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.post('/', validate(createCategorySchema), asyncHandler(controller.create));
router.patch('/:id', validate(updateCategorySchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
```

- [ ] **Step 6: Mount in `server/src/app.js`**

Add import + mount near other routes:
```js
const adminCategoryRoutes = require('./routes/adminCategories');
// ...
app.use('/admin/categories', adminCategoryRoutes);
```

- [ ] **Step 7: Run — expect PASS (7/7)**

- [ ] **Step 8: Commit**

```bash
git add server/src/validators/adminCategoryValidators.js server/src/controllers/adminCategoryController.js server/src/routes/adminCategories.js server/src/app.js server/tests/integration/admin-categories.test.js
git commit -m "feat(server): admin categories CRUD endpoints"
```

---

## Task 2: Admin puzzles CRUD

**Files:**
- Create: `server/src/validators/adminPuzzleValidators.js`
- Create: `server/src/controllers/adminPuzzleController.js`
- Create: `server/src/routes/adminPuzzles.js`
- Modify: `server/src/app.js` (mount)
- Create: `server/tests/integration/admin-puzzles.test.js`

- [ ] **Step 1: Validators**

```js
// server/src/validators/adminPuzzleValidators.js
const { z } = require('zod');

const mongoId = z.string().regex(/^[a-f0-9]{24}$/);

const createPuzzleSchema = z.object({
  plate: z.string().min(1).max(20),
  answer: z.string().min(1).max(200),
  categoryId: mongoId,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  clue: z.string().min(1).max(500),
  revealSequence: z.array(z.number().int().min(0)).min(1),
  basePoints: z.number().int().min(0).optional(),
  timeLimitSeconds: z.number().int().min(5).optional(),
  isPremium: z.boolean().optional(),
}).strict();

const updatePuzzleSchema = createPuzzleSchema.partial().strict();

const listPuzzlesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categorySlug: z.string().max(40).optional(),
});

module.exports = { createPuzzleSchema, updatePuzzleSchema, listPuzzlesQuery, mongoId };
```

- [ ] **Step 2: Failing test**

```js
// server/tests/integration/admin-puzzles.test.js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const mongoose = require('mongoose');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

async function seed() {
  const cat = await Category.create({ slug: 'movies', name: 'Movies' });
  return cat;
}

describe('admin puzzles CRUD', () => {
  it('POST /admin/puzzles creates', async () => {
    const cat = await seed();
    const res = await request(app()).post('/admin/puzzles').set(authHeader(await admin())).send({
      plate: 'LUV2MRO', answer: 'love tomorrow', categoryId: cat._id.toString(),
      difficulty: 'easy', clue: 'feeling', revealSequence: [0, 1, 2],
    });
    expect(res.status).toBe(201);
    expect(res.body.puzzle.plate).toBe('LUV2MRO');
    expect(res.body.puzzle.answer).toBe('love tomorrow');
  });

  it('POST validates revealSequence', async () => {
    const cat = await seed();
    const res = await request(app()).post('/admin/puzzles').set(authHeader(await admin())).send({
      plate: 'X', answer: 'x', categoryId: cat._id.toString(),
      difficulty: 'easy', clue: 'x', revealSequence: [],
    });
    expect(res.status).toBe(400);
  });

  it('GET /admin/puzzles returns paginated list with answers', async () => {
    const cat = await seed();
    for (let i = 0; i < 3; i++) {
      await Puzzle.create({
        plate: `P${i}`, answer: `a${i}`, categoryId: cat._id, difficulty: 'easy',
        clue: 'x', revealSequence: [0],
      });
    }
    const res = await request(app()).get('/admin/puzzles').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.puzzles).toHaveLength(3);
    expect(res.body.puzzles[0].answer).toBeDefined();
  });

  it('GET filters by categorySlug', async () => {
    const movies = await seed();
    const music = await Category.create({ slug: 'music', name: 'Music' });
    await Puzzle.create({ plate: 'P1', answer: 'a', categoryId: movies._id, difficulty: 'easy', clue: 'x', revealSequence: [0] });
    await Puzzle.create({ plate: 'P2', answer: 'b', categoryId: music._id, difficulty: 'easy', clue: 'x', revealSequence: [0] });
    const res = await request(app()).get('/admin/puzzles?categorySlug=music').set(authHeader(await admin()));
    expect(res.body.total).toBe(1);
    expect(res.body.puzzles[0].plate).toBe('P2');
  });

  it('GET /admin/puzzles/:id returns one with answer', async () => {
    const cat = await seed();
    const p = await Puzzle.create({
      plate: 'LUV2MRO', answer: 'love tomorrow', categoryId: cat._id,
      difficulty: 'easy', clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).get(`/admin/puzzles/${p._id}`).set(authHeader(await admin()));
    expect(res.body.puzzle.answer).toBe('love tomorrow');
  });

  it('PATCH /admin/puzzles/:id updates fields', async () => {
    const cat = await seed();
    const p = await Puzzle.create({
      plate: 'A', answer: 'a', categoryId: cat._id, difficulty: 'easy', clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).patch(`/admin/puzzles/${p._id}`).set(authHeader(await admin()))
      .send({ difficulty: 'hard', clue: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.puzzle.difficulty).toBe('hard');
    expect(res.body.puzzle.clue).toBe('updated');
  });

  it('DELETE removes puzzle', async () => {
    const cat = await seed();
    const p = await Puzzle.create({
      plate: 'A', answer: 'a', categoryId: cat._id, difficulty: 'easy', clue: 'x', revealSequence: [0],
    });
    const res = await request(app()).delete(`/admin/puzzles/${p._id}`).set(authHeader(await admin()));
    expect(res.status).toBe(204);
    expect(await Puzzle.findById(p._id)).toBeNull();
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'user@test.com' });
    const res = await request(app()).get('/admin/puzzles').set(authHeader(user));
    expect(res.status).toBe(403);
  });

  it('404 on unknown id', async () => {
    const fake = new mongoose.Types.ObjectId();
    const res = await request(app()).get(`/admin/puzzles/${fake}`).set(authHeader(await admin()));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Controller**

```js
// server/src/controllers/adminPuzzleController.js
const Puzzle = require('../models/Puzzle');
const Category = require('../models/Category');
const { HttpError } = require('../middleware/errorHandler');
const { listPuzzlesQuery, mongoId } = require('../validators/adminPuzzleValidators');

async function list(req, res) {
  const parsed = listPuzzlesQuery.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'Invalid query', 'VALIDATION_ERROR');
  const { page, limit, categorySlug } = parsed.data;
  const filter = {};
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug });
    if (!cat) return res.json({ puzzles: [], total: 0, page, limit });
    filter.categoryId = cat._id;
  }
  const [puzzles, total] = await Promise.all([
    Puzzle.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Puzzle.countDocuments(filter),
  ]);
  res.json({ puzzles, total, page, limit });
}

async function getOne(req, res) {
  const idCheck = mongoId.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid id', 'INVALID_ID');
  const puzzle = await Puzzle.findById(req.params.id);
  if (!puzzle) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.json({ puzzle });
}

async function create(req, res) {
  const puzzle = await Puzzle.create(req.body);
  res.status(201).json({ puzzle });
}

async function update(req, res) {
  const idCheck = mongoId.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid id', 'INVALID_ID');
  const puzzle = await Puzzle.findById(req.params.id);
  if (!puzzle) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  Object.assign(puzzle, req.body);
  await puzzle.save();
  res.json({ puzzle });
}

async function remove(req, res) {
  const idCheck = mongoId.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid id', 'INVALID_ID');
  const puzzle = await Puzzle.findByIdAndDelete(req.params.id);
  if (!puzzle) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
```

- [ ] **Step 5: Route**

```js
// server/src/routes/adminPuzzles.js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { createPuzzleSchema, updatePuzzleSchema } = require('../validators/adminPuzzleValidators');
const controller = require('../controllers/adminPuzzleController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', validate(createPuzzleSchema), asyncHandler(controller.create));
router.patch('/:id', validate(updatePuzzleSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
```

- [ ] **Step 6: Mount in `server/src/app.js`**

```js
const adminPuzzleRoutes = require('./routes/adminPuzzles');
// ...
app.use('/admin/puzzles', adminPuzzleRoutes);
```

- [ ] **Step 7: Run — expect PASS (9/9)**

- [ ] **Step 8: Commit**

```bash
git add server/src/validators/adminPuzzleValidators.js server/src/controllers/adminPuzzleController.js server/src/routes/adminPuzzles.js server/src/app.js server/tests/integration/admin-puzzles.test.js
git commit -m "feat(server): admin puzzles CRUD endpoints"
```

---

## Task 3: Admin users list + update

**Files:**
- Create: `server/src/validators/adminUserValidators.js`
- Create: `server/src/controllers/adminUserController.js`
- Create: `server/src/routes/adminUsers.js`
- Modify: `server/src/app.js` (mount)
- Create: `server/tests/integration/admin-users.test.js`

- [ ] **Step 1: Validators**

```js
// server/src/validators/adminUserValidators.js
const { z } = require('zod');

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().max(100).optional(),
});

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  plan: z.enum(['free', 'premium']).optional(),
}).strict();

module.exports = { listQuery, updateUserSchema };
```

- [ ] **Step 2: Failing test**

```js
// server/tests/integration/admin-users.test.js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const User = require('../../src/models/User');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

describe('admin users', () => {
  it('GET /admin/users lists paginated', async () => {
    await createUser({ email: 'a@x.com' });
    await createUser({ email: 'b@x.com' });
    const res = await request(app()).get('/admin/users').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(3); // 2 + admin
  });

  it('GET /admin/users filters by q email substring', async () => {
    await createUser({ email: 'alice@x.com' });
    await createUser({ email: 'bob@x.com' });
    const res = await request(app()).get('/admin/users?q=alice').set(authHeader(await admin()));
    expect(res.body.users.some(u => u.email === 'alice@x.com')).toBe(true);
    expect(res.body.users.some(u => u.email === 'bob@x.com')).toBe(false);
  });

  it('PATCH /admin/users/:id updates role', async () => {
    const target = await createUser({ email: 'target@x.com' });
    const res = await request(app()).patch(`/admin/users/${target._id}`).set(authHeader(await admin()))
      .send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
  });

  it('PATCH updates plan', async () => {
    const target = await createUser({ email: 'target@x.com' });
    const res = await request(app()).patch(`/admin/users/${target._id}`).set(authHeader(await admin()))
      .send({ plan: 'premium' });
    expect(res.body.user.plan).toBe('premium');
  });

  it('PATCH rejects unknown field', async () => {
    const target = await createUser({ email: 'target@x.com' });
    const res = await request(app()).patch(`/admin/users/${target._id}`).set(authHeader(await admin()))
      .send({ email: 'hacker@x.com' });
    expect(res.status).toBe(400);
  });

  it('PATCH 404 on unknown user', async () => {
    const mongoose = require('mongoose');
    const id = new mongoose.Types.ObjectId();
    const res = await request(app()).patch(`/admin/users/${id}`).set(authHeader(await admin()))
      .send({ role: 'admin' });
    expect(res.status).toBe(404);
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'u@x.com' });
    const res = await request(app()).get('/admin/users').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

- [ ] **Step 4: Controller**

```js
// server/src/controllers/adminUserController.js
const User = require('../models/User');
const { HttpError } = require('../middleware/errorHandler');
const { listQuery } = require('../validators/adminUserValidators');

async function list(req, res) {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'Invalid query', 'VALIDATION_ERROR');
  const { page, limit, q } = parsed.data;
  const filter = {};
  if (q) filter.email = { $regex: q.toLowerCase(), $options: 'i' };
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page, limit });
}

async function update(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.plan !== undefined) user.plan = req.body.plan;
  await user.save();
  res.json({ user });
}

module.exports = { list, update };
```

- [ ] **Step 5: Route**

```js
// server/src/routes/adminUsers.js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { updateUserSchema } = require('../validators/adminUserValidators');
const controller = require('../controllers/adminUserController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.patch('/:id', validate(updateUserSchema), asyncHandler(controller.update));

module.exports = router;
```

- [ ] **Step 6: Mount in `server/src/app.js`**

```js
const adminUserRoutes = require('./routes/adminUsers');
// ...
app.use('/admin/users', adminUserRoutes);
```

- [ ] **Step 7: Run — expect PASS (7/7)**

- [ ] **Step 8: Commit**

```bash
git add server/src/validators/adminUserValidators.js server/src/controllers/adminUserController.js server/src/routes/adminUsers.js server/src/app.js server/tests/integration/admin-users.test.js
git commit -m "feat(server): admin users list + update role/plan"
```

---

## Task 4: Admin stats

**Files:**
- Create: `server/src/controllers/adminStatsController.js`
- Create: `server/src/routes/adminStats.js`
- Modify: `server/src/app.js`
- Create: `server/tests/integration/admin-stats.test.js`

- [ ] **Step 1: Failing test**

```js
// server/tests/integration/admin-stats.test.js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');
const Subscription = require('../../src/models/Subscription');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

describe('GET /admin/stats', () => {
  it('returns aggregate counts', async () => {
    const u1 = await createUser({ email: 'a@x.com', plan: 'premium' });
    const u2 = await createUser({ email: 'b@x.com' });
    const cat = await Category.create({ slug: 'm', name: 'M' });
    await Puzzle.create({ plate: 'A', answer: 'a', categoryId: cat._id, difficulty: 'easy', clue: 'x', revealSequence: [0], isPremium: true });
    await Puzzle.create({ plate: 'B', answer: 'b', categoryId: cat._id, difficulty: 'easy', clue: 'x', revealSequence: [0] });
    const p = await Puzzle.findOne({ plate: 'A' });
    await GameSession.create({ userId: u1._id, puzzleId: p._id, solved: true, completedAt: new Date() });
    await GameSession.create({ userId: u2._id, puzzleId: p._id });
    await Subscription.create({
      userId: u1._id, stripeCustomerId: 'c', stripeSubscriptionId: 's',
      status: 'active', currentPeriodEnd: new Date(),
    });

    const res = await request(app()).get('/admin/stats').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.users.total).toBeGreaterThanOrEqual(3);
    expect(res.body.users.premium).toBe(1);
    expect(res.body.puzzles.total).toBe(2);
    expect(res.body.puzzles.premium).toBe(1);
    expect(res.body.sessions.total).toBe(2);
    expect(res.body.sessions.solved).toBe(1);
    expect(res.body.subscriptions.active).toBe(1);
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'u@x.com' });
    const res = await request(app()).get('/admin/stats').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Controller**

```js
// server/src/controllers/adminStatsController.js
const User = require('../models/User');
const Puzzle = require('../models/Puzzle');
const GameSession = require('../models/GameSession');
const Subscription = require('../models/Subscription');

async function stats(req, res) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    usersTotal, usersPremium,
    puzzlesTotal, puzzlesPremium,
    sessionsTotal, sessionsSolved, sessionsLast7,
    subsActive, subsCanceled,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ plan: 'premium' }),
    Puzzle.countDocuments({}),
    Puzzle.countDocuments({ isPremium: true }),
    GameSession.countDocuments({}),
    GameSession.countDocuments({ solved: true }),
    GameSession.countDocuments({ startedAt: { $gte: sevenDaysAgo } }),
    Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
    Subscription.countDocuments({ status: 'canceled' }),
  ]);
  res.json({
    users: { total: usersTotal, premium: usersPremium },
    puzzles: { total: puzzlesTotal, premium: puzzlesPremium },
    sessions: { total: sessionsTotal, solved: sessionsSolved, last7Days: sessionsLast7 },
    subscriptions: { active: subsActive, canceled: subsCanceled },
  });
}

module.exports = { stats };
```

- [ ] **Step 4: Route**

```js
// server/src/routes/adminStats.js
const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/adminStatsController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.stats));

module.exports = router;
```

- [ ] **Step 5: Mount in `server/src/app.js`**

```js
const adminStatsRoutes = require('./routes/adminStats');
// ...
app.use('/admin/stats', adminStatsRoutes);
```

- [ ] **Step 6: Run — expect PASS (2/2)**

- [ ] **Step 7: Commit**

```bash
git add server/src/controllers/adminStatsController.js server/src/routes/adminStats.js server/src/app.js server/tests/integration/admin-stats.test.js
git commit -m "feat(server): GET /admin/stats with user/puzzle/session/sub counts"
```

---

## Task 5: GET /admin/pricing history

**Files:**
- Modify: `server/src/controllers/pricingController.js`
- Modify: `server/src/routes/pricing.js`
- Create: `server/tests/integration/admin-pricing-list.test.js`

- [ ] **Step 1: Failing test**

```js
// server/tests/integration/admin-pricing-list.test.js
const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Pricing = require('../../src/models/Pricing');

registerHooks();
const app = () => getApp();

async function admin() { return createUser({ email: 'admin@test.com', role: 'admin' }); }

describe('GET /admin/pricing', () => {
  it('returns full pricing history, newest first', async () => {
    await Pricing.create({ stripePriceId: 'price_1', amountCents: 500, currency: 'usd', interval: 'month', active: false });
    await new Promise(r => setTimeout(r, 10));
    await Pricing.create({ stripePriceId: 'price_2', amountCents: 900, currency: 'usd', interval: 'month', active: true });
    const res = await request(app()).get('/admin/pricing').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.pricing).toHaveLength(2);
    expect(res.body.pricing[0].stripePriceId).toBe('price_2');
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'u@x.com' });
    const res = await request(app()).get('/admin/pricing').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
```

- [ ] **Step 2: Add to `server/src/controllers/pricingController.js`**

Append:
```js
async function listAll(req, res) {
  const pricing = await Pricing.find().sort({ createdAt: -1 });
  res.json({ pricing });
}

module.exports = { getActive, upsert, listAll };
```

- [ ] **Step 3: Add to `server/src/routes/pricing.js`**

Before the existing `POST /admin/pricing` line, add:
```js
router.get(
  '/admin/pricing',
  authRequired({ roles: ['admin'] }),
  asyncHandler(controller.listAll)
);
```

- [ ] **Step 4: Run — expect PASS (2/2)**

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/pricingController.js server/src/routes/pricing.js server/tests/integration/admin-pricing-list.test.js
git commit -m "feat(server): GET /admin/pricing (full history, admin only)"
```

---

## Task 6: Admin layout + role guard + route wiring

**Files:**
- Create: `src/admin/AdminRoute.jsx`
- Create: `src/admin/AdminLayout.jsx`
- Create: `src/admin/api.js`
- Modify: `src/App.jsx` (add /admin routes)

- [ ] **Step 1: Create `src/admin/AdminRoute.jsx`**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-navy">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/game-start" replace />;
  return children;
}
```

- [ ] **Step 2: Create `src/admin/api.js`**

```js
import { api } from '../api/client';

export const adminApi = {
  stats: () => api.get('/admin/stats'),

  listCategories: () => api.get('/admin/categories'),
  createCategory: (body) => api.post('/admin/categories', body),
  updateCategory: (id, body) => api.patch(`/admin/categories/${id}`, body),
  deleteCategory: (id) => api.request ? null : api.get(`/admin/categories/${id}`), // see note below
};
```

Note: our `api` client doesn't expose DELETE directly. Extend `src/api/client.js`:

Open `src/api/client.js` and add `delete` to the `api` export:
```js
export const api = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => apiRequest(path, { ...opts, method: 'DELETE' }),
};
```

Then finalize `src/admin/api.js`:
```js
import { api } from '../api/client';

export const adminApi = {
  stats: () => api.get('/admin/stats'),

  listCategories: () => api.get('/admin/categories'),
  createCategory: (body) => api.post('/admin/categories', body),
  updateCategory: (id, body) => api.patch(`/admin/categories/${id}`, body),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  listPuzzles: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/puzzles${q ? `?${q}` : ''}`);
  },
  getPuzzle: (id) => api.get(`/admin/puzzles/${id}`),
  createPuzzle: (body) => api.post('/admin/puzzles', body),
  updatePuzzle: (id, body) => api.patch(`/admin/puzzles/${id}`, body),
  deletePuzzle: (id) => api.delete(`/admin/puzzles/${id}`),

  listUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/admin/users${q ? `?${q}` : ''}`);
  },
  updateUser: (id, body) => api.patch(`/admin/users/${id}`, body),

  listPricing: () => api.get('/admin/pricing'),
  upsertPricing: (body) => api.post('/admin/pricing', body),
};
```

- [ ] **Step 3: Create `src/admin/AdminLayout.jsx`**

```jsx
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/puzzles', label: 'Puzzles' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/pricing', label: 'Pricing' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <aside className="sm:w-56 bg-navy text-cream p-4 sm:min-h-screen">
        <div className="mb-6">
          <div className="font-serif text-xl">Admin</div>
          <div className="text-xs text-cream/70 break-words">{user?.email}</div>
        </div>
        <nav className="flex sm:flex-col gap-2 flex-wrap">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded ${isActive ? 'bg-brand-orange text-white' : 'hover:bg-navy-soft'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 text-xs">
          <button onClick={logout} className="underline">Sign out</button>{' '}·{' '}
          <a href="/game-start" className="underline">Back to game</a>
        </div>
      </aside>
      <main className="flex-1 p-6 bg-cream/30">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Wire routes in `src/App.jsx`**

Add imports:
```jsx
import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { CategoriesPage } from './pages/admin/CategoriesPage';
import { PuzzlesPage } from './pages/admin/PuzzlesPage';
import { UsersPage } from './pages/admin/UsersPage';
import { PricingPage } from './pages/admin/PricingPage';
```

Add nested routes inside `<Routes>` — placement before the catch-all, after existing routes:
```jsx
<Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  <Route index element={<DashboardPage />} />
  <Route path="puzzles" element={<PuzzlesPage />} />
  <Route path="categories" element={<CategoriesPage />} />
  <Route path="users" element={<UsersPage />} />
  <Route path="pricing" element={<PricingPage />} />
</Route>
```

The 5 page components are created in Tasks 7–11. Until those exist the frontend will error on the import. **To unblock this task's commit**, also create empty stubs for the 5 pages (each exports a default "coming soon" element). Each later task replaces its respective stub.

Create `src/pages/admin/DashboardPage.jsx`, `CategoriesPage.jsx`, `PuzzlesPage.jsx`, `UsersPage.jsx`, `PricingPage.jsx`:
```jsx
export function DashboardPage() { return <div>Dashboard (coming soon)</div>; }
```
(Rename the function per file.)

- [ ] **Step 5: Manual verification**

Go to `/admin` as a non-admin — redirected to `/game-start`. As admin (email in `ADMIN_EMAILS`, re-login), see the sidebar with 5 links and "Dashboard (coming soon)".

- [ ] **Step 6: Commit**

```bash
git add src/admin/ src/pages/admin/ src/api/client.js src/App.jsx
git commit -m "feat(frontend): admin layout, role guard, route wiring, api helpers"
```

---

## Task 7: Dashboard page

**Files:**
- Modify: `src/pages/admin/DashboardPage.jsx`

- [ ] **Step 1: Replace the stub**

```jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.stats().then(setStats).catch(err => setError(err.message));
  }, []);

  if (error) return <Error message={error} />;
  if (!stats) return <div>Loading…</div>;

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Users total" value={stats.users.total} />
        <Stat label="Premium users" value={stats.users.premium} />
        <Stat label="Puzzles total" value={stats.puzzles.total} />
        <Stat label="Premium puzzles" value={stats.puzzles.premium} />
        <Stat label="Sessions total" value={stats.sessions.total} />
        <Stat label="Solved" value={stats.sessions.solved} />
        <Stat label="Sessions (7d)" value={stats.sessions.last7Days} />
        <Stat label="Active subs" value={stats.subscriptions.active} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-card-gray2 shadow-sm">
      <div className="text-xs uppercase text-text-muted2 tracking-wide">{label}</div>
      <div className="text-3xl font-bold text-navy mt-1">{value}</div>
    </div>
  );
}

function Error({ message }) {
  return <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{message}</div>;
}
```

- [ ] **Step 2: Manual verification**

Visit `/admin` as admin. See 8 stat cards.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/DashboardPage.jsx
git commit -m "feat(frontend): admin dashboard with live stats"
```

---

## Task 8: Categories admin page

**Files:**
- Modify: `src/pages/admin/CategoriesPage.jsx`

- [ ] **Step 1: Replace stub**

```jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function CategoriesPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ slug: '', name: '', icon: '', isPremium: false });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const { categories } = await adminApi.listCategories();
      setRows(categories);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      await adminApi.createCategory({
        slug: form.slug.trim(),
        name: form.name.trim(),
        icon: form.icon.trim() || undefined,
        isPremium: !!form.isPremium,
      });
      setForm({ slug: '', name: '', icon: '', isPremium: false });
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function togglePremium(row) {
    try {
      await adminApi.updateCategory(row._id, { isPremium: !row.isPremium });
      await load();
    } catch (err) { setError(err.message); }
  }

  async function remove(row) {
    if (!confirm(`Delete category "${row.name}"?`)) return;
    try {
      await adminApi.deleteCategory(row._id);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Categories</h1>

      <form onSubmit={create} className="bg-white rounded-xl border border-card-gray2 p-4 mb-6 grid sm:grid-cols-5 gap-2 items-end">
        <label className="block text-sm">
          Slug
          <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
            required pattern="[a-z0-9-]+" className="w-full border border-card-gray2 rounded px-2 py-1" />
        </label>
        <label className="block text-sm">
          Name
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            required className="w-full border border-card-gray2 rounded px-2 py-1" />
        </label>
        <label className="block text-sm">
          Icon path
          <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
            className="w-full border border-card-gray2 rounded px-2 py-1" placeholder="/icon.png" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isPremium}
            onChange={e => setForm({ ...form, isPremium: e.target.checked })} />
          Premium
        </label>
        <button type="submit" disabled={busy}
          className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange disabled:opacity-60">
          {busy ? 'Saving…' : 'Add'}
        </button>
      </form>

      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Slug</th>
            <th className="p-3">Name</th>
            <th className="p-3">Premium</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3 font-mono text-sm">{r.slug}</td>
              <td className="p-3">{r.name}</td>
              <td className="p-3">
                <button onClick={() => togglePremium(r)}
                  className={`text-xs px-2 py-1 rounded ${r.isPremium ? 'bg-brand-orange text-white' : 'bg-card-gray text-navy'}`}>
                  {r.isPremium ? 'Premium' : 'Free'}
                </button>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => remove(r)} className="text-red-600 text-sm underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Add a category via the form. Toggle its premium flag. Try to delete the seeded `movies` (should fail with 409 since puzzles reference it). Delete an empty new one.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/CategoriesPage.jsx
git commit -m "feat(frontend): admin categories CRUD page"
```

---

## Task 9: Puzzles admin page

**Files:**
- Modify: `src/pages/admin/PuzzlesPage.jsx`

- [ ] **Step 1: Replace stub**

```jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

const EMPTY = {
  plate: '', answer: '', categoryId: '', difficulty: 'easy',
  clue: '', revealSequence: '', basePoints: 100, timeLimitSeconds: 60, isPremium: false,
};

export function PuzzlesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // puzzle id or 'new'
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);

  async function load() {
    try {
      const [pList, cList] = await Promise.all([
        adminApi.listPuzzles({ page, limit: 20 }),
        adminApi.listCategories(),
      ]);
      setRows(pList.puzzles);
      setTotal(pList.total);
      setCategories(cList.categories);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, [page]);

  function openNew() {
    setEditing('new');
    setForm(EMPTY);
    setError(null);
  }

  async function openEdit(id) {
    setError(null);
    try {
      const { puzzle } = await adminApi.getPuzzle(id);
      setEditing(id);
      setForm({
        plate: puzzle.plate,
        answer: puzzle.answer,
        categoryId: String(puzzle.categoryId),
        difficulty: puzzle.difficulty,
        clue: puzzle.clue,
        revealSequence: puzzle.revealSequence.join(','),
        basePoints: puzzle.basePoints,
        timeLimitSeconds: puzzle.timeLimitSeconds,
        isPremium: puzzle.isPremium,
      });
    } catch (err) { setError(err.message); }
  }

  async function save(e) {
    e.preventDefault();
    setError(null);
    const revealSequence = form.revealSequence.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
    const body = {
      plate: form.plate.trim(),
      answer: form.answer.trim(),
      categoryId: form.categoryId,
      difficulty: form.difficulty,
      clue: form.clue.trim(),
      revealSequence,
      basePoints: Number(form.basePoints),
      timeLimitSeconds: Number(form.timeLimitSeconds),
      isPremium: !!form.isPremium,
    };
    try {
      if (editing === 'new') await adminApi.createPuzzle(body);
      else await adminApi.updatePuzzle(editing, body);
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (err) { setError(err.message); }
  }

  async function remove(row) {
    if (!confirm(`Delete puzzle ${row.plate}?`)) return;
    try {
      await adminApi.deletePuzzle(row._id);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif text-navy">Puzzles</h1>
        <button onClick={openNew} className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">New puzzle</button>
      </div>

      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>}

      {editing && (
        <form onSubmit={save} className="bg-white border border-card-gray2 rounded-xl p-4 mb-6 grid sm:grid-cols-3 gap-3">
          <label>Plate<input className="w-full border rounded px-2 py-1" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} required /></label>
          <label>Answer<input className="w-full border rounded px-2 py-1" value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} required /></label>
          <label>Category
            <select className="w-full border rounded px-2 py-1" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
              <option value="">—</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label>Difficulty
            <select className="w-full border rounded px-2 py-1" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </label>
          <label className="sm:col-span-2">Clue<input className="w-full border rounded px-2 py-1" value={form.clue} onChange={e => setForm({ ...form, clue: e.target.value })} required /></label>
          <label className="sm:col-span-3">Reveal sequence (comma-separated indices)
            <input className="w-full border rounded px-2 py-1 font-mono" value={form.revealSequence} onChange={e => setForm({ ...form, revealSequence: e.target.value })} required placeholder="0,1,2,3" />
          </label>
          <label>Base points<input type="number" className="w-full border rounded px-2 py-1" value={form.basePoints} onChange={e => setForm({ ...form, basePoints: e.target.value })} /></label>
          <label>Time limit (s)<input type="number" className="w-full border rounded px-2 py-1" value={form.timeLimitSeconds} onChange={e => setForm({ ...form, timeLimitSeconds: e.target.value })} /></label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPremium} onChange={e => setForm({ ...form, isPremium: e.target.checked })} />
            Premium
          </label>
          <div className="sm:col-span-3 flex gap-2">
            <button type="submit" className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">Save</button>
            <button type="button" onClick={() => { setEditing(null); setForm(EMPTY); }} className="py-2 px-4 rounded border border-navy text-navy">Cancel</button>
          </div>
        </form>
      )}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Plate</th><th className="p-3">Answer</th><th className="p-3">Difficulty</th><th className="p-3">Premium</th><th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3 font-mono">{r.plate}</td>
              <td className="p-3">{r.answer}</td>
              <td className="p-3">{r.difficulty}</td>
              <td className="p-3">{r.isPremium ? '★' : ''}</td>
              <td className="p-3 text-right">
                <button onClick={() => openEdit(r._id)} className="text-brand-orange-dark underline text-sm mr-3">Edit</button>
                <button onClick={() => remove(r)} className="text-red-600 underline text-sm">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="underline disabled:opacity-40">Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="underline disabled:opacity-40">Next</button>
        <span className="text-text-muted2">{total} total</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Create a new puzzle with a valid revealSequence, save, see it in the list. Edit one (change difficulty). Delete one.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/PuzzlesPage.jsx
git commit -m "feat(frontend): admin puzzles list + create/edit form"
```

---

## Task 10: Users admin page

**Files:**
- Modify: `src/pages/admin/UsersPage.jsx`

- [ ] **Step 1: Replace stub**

```jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function UsersPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  async function load() {
    try {
      const { users, total } = await adminApi.listUsers({ page, limit: 20, ...(q ? { q } : {}) });
      setRows(users);
      setTotal(total);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, [page]);

  async function update(id, patch) {
    setError(null);
    try {
      await adminApi.updateUser(id, patch);
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Users</h1>
      <form className="mb-4 flex gap-2" onSubmit={e => { e.preventDefault(); setPage(1); load(); }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search email"
          className="border border-card-gray2 rounded px-3 py-2 flex-1" />
        <button className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">Search</button>
      </form>

      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Plan</th><th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(u => (
            <tr key={u._id} className="border-t border-card-gray2">
              <td className="p-3">{u.email}</td>
              <td className="p-3">
                <select value={u.role} onChange={e => update(u._id, { role: e.target.value })}
                  className="border border-card-gray2 rounded px-2 py-1">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-3">
                <select value={u.plan} onChange={e => update(u._id, { plan: e.target.value })}
                  className="border border-card-gray2 rounded px-2 py-1">
                  <option value="free">free</option>
                  <option value="premium">premium</option>
                </select>
              </td>
              <td className="p-3 text-sm text-text-muted2">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="underline disabled:opacity-40">Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="underline disabled:opacity-40">Next</button>
        <span className="text-text-muted2">{total} total</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Search by email. Change a user's role to admin and confirm next reload shows the change. Change a user's plan to premium.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/UsersPage.jsx
git commit -m "feat(frontend): admin users page with role + plan toggles"
```

---

## Task 11: Pricing admin page

**Files:**
- Modify: `src/pages/admin/PricingPage.jsx`

- [ ] **Step 1: Replace stub**

```jsx
import { useEffect, useState } from 'react';
import { adminApi } from '../../admin/api';

export function PricingPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ stripePriceId: '', amountCents: 900, currency: 'usd', interval: 'month' });
  const [error, setError] = useState(null);

  async function load() {
    try {
      const { pricing } = await adminApi.listPricing();
      setRows(pricing);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    setError(null);
    try {
      await adminApi.upsertPricing({
        stripePriceId: form.stripePriceId.trim(),
        amountCents: Number(form.amountCents),
        currency: form.currency.trim().toLowerCase(),
        interval: form.interval,
      });
      setForm({ stripePriceId: '', amountCents: 900, currency: 'usd', interval: 'month' });
      await load();
    } catch (err) { setError(err.message); }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif text-navy mb-6">Pricing</h1>

      <form onSubmit={save} className="bg-white rounded-xl border border-card-gray2 p-4 mb-6 grid sm:grid-cols-5 gap-3 items-end">
        <label>Stripe Price ID
          <input required value={form.stripePriceId} onChange={e => setForm({ ...form, stripePriceId: e.target.value })}
            className="w-full border rounded px-2 py-1 font-mono" placeholder="price_..." />
        </label>
        <label>Amount (cents)
          <input type="number" min="0" required value={form.amountCents} onChange={e => setForm({ ...form, amountCents: e.target.value })}
            className="w-full border rounded px-2 py-1" />
        </label>
        <label>Currency
          <input maxLength={3} required value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
            className="w-full border rounded px-2 py-1 uppercase" />
        </label>
        <label>Interval
          <select value={form.interval} onChange={e => setForm({ ...form, interval: e.target.value })}
            className="w-full border rounded px-2 py-1">
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </label>
        <button type="submit" className="py-2 px-4 rounded navy-gradient text-cream border-2 border-brand-orange">Set active</button>
      </form>

      {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</div>}

      <table className="w-full bg-white rounded-xl border border-card-gray2">
        <thead className="text-left text-xs uppercase text-text-muted2">
          <tr>
            <th className="p-3">Stripe Price ID</th><th className="p-3">Amount</th><th className="p-3">Currency</th><th className="p-3">Interval</th><th className="p-3">Active</th><th className="p-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id} className="border-t border-card-gray2">
              <td className="p-3 font-mono text-sm">{r.stripePriceId}</td>
              <td className="p-3">{(r.amountCents / 100).toFixed(2)}</td>
              <td className="p-3 uppercase">{r.currency}</td>
              <td className="p-3">{r.interval}</td>
              <td className="p-3">{r.active ? '★ active' : ''}</td>
              <td className="p-3 text-sm text-text-muted2">{new Date(r.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Add a Stripe price id + amount. See it become the active row. Add another — it becomes active, prior becomes inactive.

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/PricingPage.jsx
git commit -m "feat(frontend): admin pricing page replaces curl setup"
```

---

## Task 12: README + final smoke

**Files:**
- Modify: `server/README.md`

- [ ] **Step 1: Append an "Admin panel" section to README**

```markdown
## Admin panel

Any user whose email is in `ADMIN_EMAILS` is auto-promoted to `admin` role on sign-in. Once signed in as an admin, visit http://localhost:5173/admin to:

- **Dashboard** — aggregate user/puzzle/session/subscription counts
- **Puzzles** — full CRUD, paginated
- **Categories** — full CRUD (can't delete categories with puzzles)
- **Users** — search by email, toggle role (user/admin) and plan (free/premium) inline
- **Pricing** — upsert the active Stripe price (replaces the curl workflow)

Non-admin users hitting `/admin` are redirected back to `/game-start`.
```

- [ ] **Step 2: Run full backend suite**

```bash
cd server && npm test
```

Expected: **~155 tests passing** (128 baseline + roughly: 7 categories + 9 puzzles + 7 users + 2 stats + 2 pricing-list = 27 new). Exact numbers depend on how many sub-assertions each suite hits.

- [ ] **Step 3: Commit**

```bash
git add server/README.md
git commit -m "docs: admin panel section in README"
```

---

## Post-plan verification checklist

- [ ] `npm test` (server) — all passing
- [ ] Non-admin user → /admin → redirects to /game-start
- [ ] Admin user → /admin → sees dashboard with live numbers
- [ ] Creating a puzzle + category from the admin UI shows up in the game's `/categories` and puzzle pool
- [ ] Marking a user admin from /admin/users flips their role; they can now visit /admin
- [ ] Changing a user's plan to premium flips their gameplay access
- [ ] Setting a pricing row in /admin/pricing populates `GET /pricing` for all users
- [ ] Deleting a category that still has puzzles shows 409 error inline in UI

---

## Out of scope (for later / Plan 6)

- Bulk CSV import of puzzles
- Charts / time-series analytics
- Audit log of admin changes
- File uploads for icons (still string paths)
- Admin 2FA / session management
- Leaderboards, ads, VPS deploy (Plan 6)
