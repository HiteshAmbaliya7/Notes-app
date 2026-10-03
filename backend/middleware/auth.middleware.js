const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the JWT (HTTP-only cookie, or Bearer header) and attaches the user to req.user.
// The user and role are always loaded from the database, never trusted from the client.
const authenticateUser = asyncHandler(async (req, _res, next) => {
  let token = req.cookies && req.cookies.token;
  const header = req.headers.authorization;
  if (!token && header && header.startsWith('Bearer ')) token = header.slice(7);

  if (!token) throw new ApiError(401, 'Authentication required. Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'This account no longer exists.');

  req.user = user;
  next();
});

module.exports = { authenticateUser };
