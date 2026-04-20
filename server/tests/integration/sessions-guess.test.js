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
    const { session, user } = await seed();
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

  it('caps score at 0, never negative, even if time is way past limit', async () => {
    const { session, user } = await seed();
    await GameSession.updateOne({ _id: session._id }, { $set: { startedAt: new Date(Date.now() - 9_999_000) } });
    const res = await request(app()).post(`/sessions/${session._id}/guess`)
      .set(authHeader(user)).send({ guess: 'love tomorrow' });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
    expect(res.body.score).toBeGreaterThanOrEqual(0);
  });
});
