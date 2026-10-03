const router = require('express').Router();
const { getNotes, getTags, getNote, createNote, updateNote, deleteNote } = require('../controllers/note.controller');
const { authenticateUser } = require('../middleware/auth.middleware');

router.use(authenticateUser);

router.route('/').get(getNotes).post(createNote);
router.get('/tags', getTags); // must stay above "/:id"
router.route('/:id').get(getNote).patch(updateNote).delete(deleteNote);

module.exports = router;
