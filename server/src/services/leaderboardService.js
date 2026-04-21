const User = require('../models/User');
const GameSession = require('../models/GameSession');

function anonymize(email) {
  if (!email) return 'anonymous';
  return email.slice(0, 2) + '***';
}

function windowFilter(window) {
  if (window === 'day') {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return { completedAt: { $gte: start }, solved: true };
  }
  if (window === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    return { completedAt: { $gte: weekAgo }, solved: true };
  }
  return null;
}

async function getLeaderboard({ window, limit = 50 }) {
  if (window === 'all') {
    const users = await User.find({ totalScore: { $gt: 0 } })
      .sort({ totalScore: -1 })
      .limit(limit);
    return users.map((u, i) => ({
      rank: i + 1,
      userId: u._id,
      displayName: u.displayName || anonymize(u.email),
      score: u.totalScore,
    }));
  }
  const filter = windowFilter(window);
  if (!filter) return [];
  const rows = await GameSession.aggregate([
    { $match: filter },
    { $group: { _id: '$userId', score: { $sum: '$score' } } },
    { $sort: { score: -1 } },
    { $limit: limit },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
  ]);
  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r._id,
    displayName: r.user.displayName || anonymize(r.user.email),
    score: r.score,
  }));
}

async function getUserRank({ userId, window }) {
  if (window === 'all') {
    const me = await User.findById(userId);
    const score = me?.totalScore || 0;
    if (score === 0) return { rank: null, score: 0, window };
    const ahead = await User.countDocuments({ totalScore: { $gt: score } });
    return { rank: ahead + 1, score, window };
  }
  const filter = windowFilter(window);
  if (!filter) return { rank: null, score: 0, window };
  const agg = await GameSession.aggregate([
    { $match: filter },
    { $group: { _id: '$userId', score: { $sum: '$score' } } },
  ]);
  const mine = agg.find(r => r._id.toString() === userId.toString());
  if (!mine || mine.score === 0) return { rank: null, score: 0, window };
  const ahead = agg.filter(r => r.score > mine.score).length;
  return { rank: ahead + 1, score: mine.score, window };
}

module.exports = { getLeaderboard, getUserRank };
