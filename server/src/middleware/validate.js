const { HttpError } = require('./errorHandler');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(new HttpError(400, 'Validation failed', 'VALIDATION_ERROR'));
  }
  req[source] = result.data;
  next();
};
