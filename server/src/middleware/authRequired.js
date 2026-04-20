const { verifyAccessToken } = require('../services/tokenService');
const User = require('../models/User');
const { HttpError } = require('./errorHandler');

function extractToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

module.exports = function authRequired(options = {}) {
  const { roles } = options;
  return async (req, res, next) => {
    const token = extractToken(req);
    if (!token) return next(new HttpError(401, 'Missing token', 'UNAUTHORIZED'));
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return next(new HttpError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
    }
    const user = await User.findById(payload.sub);
    if (!user) return next(new HttpError(401, 'User not found', 'UNAUTHORIZED'));
    if (roles && !roles.includes(user.role)) {
      return next(new HttpError(403, 'Forbidden', 'FORBIDDEN'));
    }
    req.user = user;
    next();
  };
};
