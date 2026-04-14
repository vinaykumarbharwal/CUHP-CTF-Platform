const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    const userKey = req.userId || req.ip;
    const routeKey = `${req.baseUrl || ''}${req.path || ''}`;
    return `${userKey}:${routeKey}`;
  },
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = apiLimiter;
