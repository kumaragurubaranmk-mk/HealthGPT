export function errorHandler(err, req, res, next) {
  console.error('[Error]', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString()
  });
}
