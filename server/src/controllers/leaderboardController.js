const { getLeaderboard, getUserRank } = require('../services/leaderboardService');
const { HttpError } = require('../middleware/errorHandler');

const WINDOWS = ['day', 'week', 'all'];

async function list(req, res) {
  const { window } = req.params;
  if (!WINDOWS.includes(window)) throw new HttpError(400, 'Invalid window', 'INVALID_WINDOW');
  const entries = await getLeaderboard({ window });
  res.json({ entries });
}

async function me(req, res) {
  const window = WINDOWS.includes(req.query.window) ? req.query.window : 'all';
  const result = await getUserRank({ userId: req.user._id, window });
  res.json(result);
}

module.exports = { list, me };
