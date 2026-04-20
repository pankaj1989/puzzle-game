const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);

  app.use((req, res, next) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
