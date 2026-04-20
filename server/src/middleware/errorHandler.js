const env = require('../config/env');

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
  }
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const payload = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message:
        status >= 500 && env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
    },
  };
  if (env.NODE_ENV !== 'production' && status >= 500) {
    payload.error.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = { errorHandler, HttpError };
