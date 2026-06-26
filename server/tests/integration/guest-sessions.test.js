const { registerHooks } = require('../testSetup');
const { getApp, request, createUser } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const User = require('../../src/models/User');
const { signGuestAccessToken } = require('../../src/services/tokenService');

registerHooks();
const app = () => getApp();

async function seedPuzzle(category, overrides = {}) {
  return Puzzle.create({
    plate: 'ABC123',
    answer: 'test answer',
    categoryId: category._id,
    difficulty: 'easy',
    clue: 'A test clue',
    revealSequence: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    isPremium: false,
    ...overrides,
  });
}

function guestHeader(guestId) {
  return { Authorization: `Bearer ${signGuestAccessToken(guestId)}` };
}

describe('guest sessions', () => {
  it('POST /auth/guest mints a guest token', async () => {
    const res = await request(app()).post('/auth/guest').send({});
    expect(res.status).toBe(201);
    expect(res.body.guestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(res.body.accessToken).toBeTruthy();
  });

  it('guest can start, guess, and fetch session', async () => {
    const category = await Category.create({
      name: 'Free Cat',
      image: 'categories/free.png',
      isPremium: false,
    });
    await seedPuzzle(category);

    const guest = await request(app()).post('/auth/guest').send({});
    const guestId = guest.body.guestId;
    const auth = guestHeader(guestId);

    const start = await request(app()).post('/sessions/start').set(auth).send({});
    expect(start.status).toBe(201);
    expect(start.body.session.guestId).toBe(guestId);
    expect(start.body.puzzle.plate).toBe('ABC123');

    const sessionId = start.body.session.id;
    const wrong = await request(app())
      .post(`/sessions/${sessionId}/guess`)
      .set(auth)
      .send({ guess: 'wrong' });
    expect(wrong.status).toBe(200);
    expect(wrong.body.solved).toBe(false);

    const solved = await request(app())
      .post(`/sessions/${sessionId}/guess`)
      .set(auth)
      .send({ guess: 'test answer' });
    expect(solved.status).toBe(200);
    expect(solved.body.solved).toBe(true);

    const fetched = await request(app()).get(`/sessions/${sessionId}`).set(auth);
    expect(fetched.status).toBe(200);
    expect(fetched.body.session.solved).toBe(true);
  });

  it('guest cannot start with premium category', async () => {
    const premium = await Category.create({
      name: 'Premium Cat',
      image: 'categories/premium.png',
      isPremium: true,
    });
    await seedPuzzle(premium, { isPremium: true });

    const guestId = (await request(app()).post('/auth/guest').send({})).body.guestId;
    const res = await request(app())
      .post('/sessions/start')
      .set(guestHeader(guestId))
      .send({ categoryId: premium._id });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('PLAN_REQUIRED');
  });

  it('guest cannot access another guest session', async () => {
    const category = await Category.create({
      name: 'Shared Pool',
      image: 'categories/shared.png',
      isPremium: false,
    });
    await seedPuzzle(category);

    const guestA = (await request(app()).post('/auth/guest').send({})).body.guestId;
    const guestB = (await request(app()).post('/auth/guest').send({})).body.guestId;

    const start = await request(app())
      .post('/sessions/start')
      .set(guestHeader(guestA))
      .send({});
    const sessionId = start.body.session.id;

    const res = await request(app()).get(`/sessions/${sessionId}`).set(guestHeader(guestB));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('guest solve does not update user totalScore', async () => {
    const category = await Category.create({
      name: 'Score Cat',
      image: 'categories/score.png',
      isPremium: false,
    });
    const puzzle = await seedPuzzle(category, { answer: 'score test' });
    const user = await createUser({ plan: 'free', totalScore: 100 });
    const guestId = (await request(app()).post('/auth/guest').send({})).body.guestId;

    const start = await request(app())
      .post('/sessions/start')
      .set(guestHeader(guestId))
      .send({});
    const sessionId = start.body.session.id;

    await request(app())
      .post(`/sessions/${sessionId}/guess`)
      .set(guestHeader(guestId))
      .send({ guess: puzzle.answer });

    const fresh = await User.findById(user._id);
    expect(fresh.totalScore).toBe(100);
  });
});
