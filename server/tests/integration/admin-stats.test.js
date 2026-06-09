const { registerHooks } = require('../testSetup');
const { getApp, request, createUser, authHeader } = require('../helpers');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const GameSession = require('../../src/models/GameSession');
const PremiumPurchase = require('../../src/models/PremiumPurchase');

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
    await PremiumPurchase.create({
      userId: u1._id,
      stripeCustomerId: 'c',
      stripeCheckoutSessionId: 'cs_1',
      status: 'paid',
      amountCents: 900,
      currency: 'usd',
      paidAt: new Date(),
    });

    const res = await request(app()).get('/admin/stats').set(authHeader(await admin()));
    expect(res.status).toBe(200);
    expect(res.body.users.total).toBeGreaterThanOrEqual(3);
    expect(res.body.users.premium).toBe(1);
    expect(res.body.puzzles.total).toBe(2);
    expect(res.body.puzzles.premium).toBe(1);
    expect(res.body.sessions.total).toBe(2);
    expect(res.body.sessions.solved).toBe(1);
    expect(res.body.purchases.paid).toBe(1);
  });

  it('403 for non-admin', async () => {
    const user = await createUser({ email: 'u@x.com' });
    const res = await request(app()).get('/admin/stats').set(authHeader(user));
    expect(res.status).toBe(403);
  });
});
