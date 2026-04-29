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

  it('free user: passing categorySlug returns 403 PLAN_REQUIRED', async () => {
    await seedPuzzle({ isPremium: false, slug: 'movies' });
    await seedPuzzle({ isPremium: true, slug: 'music' });
    const user = await createUser({ plan: 'free' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({ categorySlug: 'music' });
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
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('returns explicit NO_PUZZLE_IN_CATEGORY when category exists but has no puzzles', async () => {
    await Category.create({ slug: 'empty-cat', name: 'Empty Cat', isPremium: false });
    const user = await createUser({ plan: 'premium' });
    const res = await request(app())
      .post('/sessions/start')
      .set(authHeader(user))
      .send({ categorySlug: 'empty-cat' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NO_PUZZLE_IN_CATEGORY');
  });

  it('free random flow never returns puzzle from premium category', async () => {
    const freeCategory = await Category.create({ slug: 'free-cat', name: 'Free Cat', isPremium: false });
    const premiumCategory = await Category.create({ slug: 'premium-cat', name: 'Premium Cat', isPremium: true });
    await Puzzle.create({
      plate: 'FREE11',
      answer: 'free one',
      categoryId: freeCategory._id,
      difficulty: 'easy',
      clue: 'free clue',
      revealSequence: [0, 1, 2],
      isPremium: false,
    });
    await Puzzle.create({
      plate: 'DRIFT1',
      answer: 'drift one',
      categoryId: premiumCategory._id,
      difficulty: 'easy',
      clue: 'drift clue',
      revealSequence: [0, 1, 2],
      isPremium: false,
    });

    const user = await createUser({ plan: 'free' });
    const res = await request(app()).post('/sessions/start').set(authHeader(user)).send({});
    expect(res.status).toBe(201);
    expect(String(res.body.puzzle.categoryId)).toBe(String(freeCategory._id));
  });

  it('requires auth', async () => {
    const res = await request(app()).post('/sessions/start').send({});
    expect(res.status).toBe(401);
  });
});
