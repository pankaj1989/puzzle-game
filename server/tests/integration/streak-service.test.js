const { computeStreakUpdate, toUtcDay } = require('../../src/services/streakService');

function day(iso) { return new Date(iso + 'T10:00:00Z'); }

describe('toUtcDay', () => {
  it('strips time, normalizes to midnight UTC', () => {
    const d = toUtcDay(new Date('2026-04-21T15:30:00Z'));
    expect(d.toISOString()).toBe('2026-04-21T00:00:00.000Z');
  });
});

describe('computeStreakUpdate', () => {
  it('first play: streak 1, longest 1', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: null, currentStreak: 0, longestStreak: 0, now: day('2026-04-21'),
    });
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(1);
    expect(r.lastPlayedDay.toISOString()).toBe('2026-04-21T00:00:00.000Z');
  });

  it('same day: no change to streak', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-21'), currentStreak: 5, longestStreak: 10, now: day('2026-04-21'),
    });
    expect(r.currentStreak).toBe(5);
    expect(r.longestStreak).toBe(10);
  });

  it('next day: increments streak; longest advances if exceeded', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-21'), currentStreak: 5, longestStreak: 5, now: day('2026-04-22'),
    });
    expect(r.currentStreak).toBe(6);
    expect(r.longestStreak).toBe(6);
  });

  it('next day: does not lower longest', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-21'), currentStreak: 5, longestStreak: 20, now: day('2026-04-22'),
    });
    expect(r.currentStreak).toBe(6);
    expect(r.longestStreak).toBe(20);
  });

  it('gap: resets to 1', () => {
    const r = computeStreakUpdate({
      lastPlayedDay: day('2026-04-18'), currentStreak: 10, longestStreak: 10, now: day('2026-04-21'),
    });
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(10);
  });
});
