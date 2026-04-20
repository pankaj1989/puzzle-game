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
