const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const profileRoutes = require('./routes/profile');

function createApp() {
  const app = express();

  if (env.TRUST_PROXY !== false) {
    app.set('trust proxy', env.TRUST_PROXY);
  }

  app.use(pinoHttp({
    level: env.LOG_LEVEL,
    autoLogging: env.NODE_ENV !== 'test',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }));

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/categories', categoryRoutes);
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);

  app.use((req, res, next) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
