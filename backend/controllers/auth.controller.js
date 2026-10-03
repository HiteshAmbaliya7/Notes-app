const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
});

const sendAuthCookie = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie('token', token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
};

const asString = (value) => (typeof value === 'string' ? value : '');

// POST /api/auth/register - always creates role "user"; any submitted role is ignored.
const register = asyncHandler(async (req, res) => {
  const name = asString(req.body.name).trim();
  const email = asString(req.body.email).trim().toLowerCase();
  const password = asString(req.body.password);

  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (name.length < 2 || name.length > 50) throw new ApiError(400, 'Name must be between 2 and 50 characters');
  if (!EMAIL_REGEX.test(email)) throw new ApiError(400, 'Please provide a valid email');
  if (password.length < 8) throw new ApiError(400, 'Password must be at least 8 characters');
  if (password.length > 72) throw new ApiError(400, 'Password must be at most 72 characters');

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({ name, email, password, role: 'user' });

  sendAuthCookie(res, user);
  res.status(201).json({ success: true, data: { user } });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const email = asString(req.body.email).trim().toLowerCase();
  const password = asString(req.body.password);

  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  sendAuthCookie(res, user);
  res.json({ success: true, data: { user } });
});

// POST /api/auth/logout - clears the auth cookie.
const logout = (_req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ success: true, data: { message: 'Logged out successfully' } });
};

// GET /api/auth/me
const getMe = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, logout, getMe };
