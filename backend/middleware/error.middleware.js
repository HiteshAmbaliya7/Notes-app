const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler: always answers with { success: false, message }.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID or value provided';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with this value already exists';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
