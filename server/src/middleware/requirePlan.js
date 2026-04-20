const { HttpError } = require('./errorHandler');

module.exports = function requirePlan(required) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Unauthorized', 'UNAUTHORIZED'));
    if (req.user.plan !== required) {
      return next(new HttpError(403, `${required} plan required`, 'PLAN_REQUIRED'));
    }
    next();
  };
};
