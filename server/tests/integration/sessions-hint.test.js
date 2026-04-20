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
    const { session, user } = await seed();
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.hintsUsed).toBe(1);
    // 'alpha'[2] = 'p' → 'P'
    expect(res.body.nextHint).toEqual({ index: 2, letter: 'P' });
    const stored = await GameSession.findById(session._id);
    expect(stored.hintsUsed).toBe(1);
  });

  it('second hint reveals the second index', async () => {
    const { session, user } = await seed();
    await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    const res = await request(app()).post(`/sessions/${session._id}/hint`).set(authHeader(user));
    expect(res.body.hintsUsed).toBe(2);
    // 'alpha'[0] = 'a' → 'A'
    expect(res.body.nextHint).toEqual({ index: 0, letter: 'A' });
  });

  it('returns 409 when all hints exhausted', async () => {
    const { session, user } = await seed();
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
