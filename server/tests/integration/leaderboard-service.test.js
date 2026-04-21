const { registerHooks } = require('../testSetup');
const User = require('../../src/models/User');
const Puzzle = require('../../src/models/Puzzle');
const Category = require('../../src/models/Category');
const GameSession = require('../../src/models/GameSession');
const { getLeaderboard, getUserRank } = require('../../src/services/leaderboardService');

registerHooks();

async function seedBase() {
  const cat = await Category.create({ slug: 'movies', name: 'Movies' });
  return Puzzle.create({
    plate: 'X', answer: 'x', categoryId: cat._id,
    difficulty: 'easy', clue: 'x', revealSequence: [0],
  });
}

async function seedSolvedSession({ user, puzzle, score, when }) {
  return GameSession.create({
    userId: user._id, puzzleId: puzzle._id,
    solved: true, score, completedAt: when, startedAt: when, finalGuess: 'x',
  });
}

describe('leaderboardService.getLeaderboard', () => {
  it('all-time ranks by User.totalScore, highest first, excludes zero', async () => {
    await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A', totalScore: 50 });
    await User.create({ email: 'b@x.com', passwordHash: 'x', displayName: 'B', totalScore: 200 });
    await User.create({ email: 'c@x.com', passwordHash: 'x', displayName: 'C', totalScore: 0 });
    const rows = await getLeaderboard({ window: 'all' });
    expect(rows[0].displayName).toBe('B');
    expect(rows[0].score).toBe(200);
    expect(rows[1].displayName).toBe('A');
    expect(rows.find(r => r.displayName === 'C')).toBeUndefined();
  });

  it('daily aggregates solved sessions completed today', async () => {
    const u1 = await User.create({ email: 'a@x.com', passwordHash: 'x', displayName: 'A' });
    const u2 = await User.create({ email: 'b@x.com', passwordHash: 'x', displayName: 'B' });
    const p = await seedBase();
    const now = new Date();
    await seedSolvedSession({ user: u1, puzzle: p, score: 30, when: now });
    await seedSolvedSession({ user: u1, puzzle: p, score: 40, when: now });
    await seedSolvedSession({ user: u2, puzzle: p, score: 100, when: now });
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
