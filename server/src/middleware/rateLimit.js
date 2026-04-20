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

const magicLinkEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,                    // 3 requests per email per hour
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  keyGenerator: (req) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    return email || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } });
  },
});

module.exports = {
  authLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  magicLinkLimiter: createLimiter({ windowMs: 60 * 60 * 1000, max: 5 }),
  magicLinkEmailLimiter,
  generalLimiter: createLimiter({ windowMs: 15 * 60 * 1000, max: 300 }),
};
