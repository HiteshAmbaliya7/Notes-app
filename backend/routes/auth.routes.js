const router = require('express').Router();
const { register, login, logout, getMe } = require('../controllers/auth.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateUser, getMe);

module.exports = router;
