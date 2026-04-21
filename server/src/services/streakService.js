function toUtcDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

const ONE_DAY_MS = 86_400_000;

function computeStreakUpdate({ lastPlayedDay, currentStreak, longestStreak, now }) {
  const today = toUtcDay(now);
  if (!lastPlayedDay) {
    return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), lastPlayedDay: today };
  }
  const last = toUtcDay(lastPlayedDay);
  const diffMs = today - last;

  if (diffMs === 0) {
    return { currentStreak, longestStreak, lastPlayedDay: last };
  }
  if (diffMs === ONE_DAY_MS) {
    const next = currentStreak + 1;
    return { currentStreak: next, longestStreak: Math.max(longestStreak, next), lastPlayedDay: today };
  }
  return { currentStreak: 1, longestStreak: Math.max(longestStreak, 1), lastPlayedDay: today };
}

module.exports = { computeStreakUpdate, toUtcDay };
