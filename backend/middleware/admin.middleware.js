const ApiError = require('../utils/ApiError');

// Must run after authenticateUser. Allows only super admins.
const isSuperAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return next(new ApiError(403, 'Access denied. Super admin only.'));
  }
  next();
};

module.exports = { isSuperAdmin };
