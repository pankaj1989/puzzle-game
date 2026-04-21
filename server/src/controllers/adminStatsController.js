const User = require('../models/User');
const Puzzle = require('../models/Puzzle');
const GameSession = require('../models/GameSession');
const Subscription = require('../models/Subscription');

async function stats(req, res) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [
    usersTotal, usersPremium,
    puzzlesTotal, puzzlesPremium,
    sessionsTotal, sessionsSolved, sessionsLast7,
    subsActive, subsCanceled,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ plan: 'premium' }),
    Puzzle.countDocuments({}),
    Puzzle.countDocuments({ isPremium: true }),
    GameSession.countDocuments({}),
    GameSession.countDocuments({ solved: true }),
    GameSession.countDocuments({ startedAt: { $gte: sevenDaysAgo } }),
    Subscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
    Subscription.countDocuments({ status: 'canceled' }),
  ]);
  res.json({
    users: { total: usersTotal, premium: usersPremium },
    puzzles: { total: puzzlesTotal, premium: puzzlesPremium },
    sessions: { total: sessionsTotal, solved: sessionsSolved, last7Days: sessionsLast7 },
    subscriptions: { active: subsActive, canceled: subsCanceled },
  });
}

module.exports = { stats };
