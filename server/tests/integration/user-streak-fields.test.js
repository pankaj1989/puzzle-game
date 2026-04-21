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
