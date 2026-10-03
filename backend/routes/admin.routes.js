const router = require('express').Router();
const { getUsers, getUser, getUserNotes, deleteUser, deleteNote } = require('../controllers/admin.controller');
const { authenticateUser } = require('../middleware/auth.middleware');
const { isSuperAdmin } = require('../middleware/admin.middleware');

router.use(authenticateUser, isSuperAdmin);

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.get('/users/:id/notes', getUserNotes);
router.delete('/users/:id', deleteUser);
router.delete('/notes/:id', deleteNote);

module.exports = router;
