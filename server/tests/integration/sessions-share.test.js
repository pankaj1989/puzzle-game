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
