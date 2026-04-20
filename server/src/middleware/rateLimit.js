const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function createLimiter({ windowMs, max, code = 'RATE_LIMITED' }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    handler: (req, res) => {
      res.status(429).json({ error: { code, message: 'Too many requests' } });
    },
  });
}

module.exports = {
  authLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  magicLinkLimiter: createLimiter({ windowMs: 60 * 60 * 1000, max: 5 }),
  generalLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 300 }),
};
