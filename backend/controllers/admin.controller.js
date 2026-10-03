const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assertValidId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid ${label} ID`);
};

// GET /api/admin/users?search=  - all users (no passwords) with note counts and totals.
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  const { search } = req.query;
  if (typeof search === 'string' && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, counts, totalUsers, totalNotes] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }),
    Note.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]),
    User.countDocuments(),
    Note.countDocuments(),
  ]);

  const countByUser = new Map(counts.map((c) => [String(c._id), c.count]));
  const rows = users.map((u) => ({ ...u.toJSON(), noteCount: countByUser.get(String(u._id)) || 0 }));

  res.json({ success: true, data: { users: rows, totalUsers, totalNotes } });
});

// GET /api/admin/users/:id
const getUser = asyncHandler(async (req, res) => {
  assertValidId(req.params.id, 'user');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const noteCount = await Note.countDocuments({ user: user._id });
  res.json({ success: true, data: { user: { ...user.toJSON(), noteCount } } });
});

// GET /api/admin/users/:id/notes
const getUserNotes = asyncHandler(async (req, res) => {
  assertValidId(req.params.id, 'user');
  if (!(await User.exists({ _id: req.params.id }))) throw new ApiError(404, 'User not found');
  const notes = await Note.find({ user: req.params.id }).sort({ updatedAt: -1 });
  res.json({ success: true, data: { count: notes.length, notes } });
});

// DELETE /api/admin/users/:id - removes the user and all of their notes.
const deleteUser = asyncHandler(async (req, res) => {
  assertValidId(req.params.id, 'user');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'superadmin') throw new ApiError(403, 'Super admin accounts cannot be deleted');

  const { deletedCount } = await Note.deleteMany({ user: user._id });
  await user.deleteOne();

  res.json({ success: true, data: { message: 'User and their notes deleted', deletedNotes: deletedCount } });
});

// DELETE /api/admin/notes/:id
const deleteNote = asyncHandler(async (req, res) => {
  assertValidId(req.params.id, 'note');
  const note = await Note.findByIdAndDelete(req.params.id);
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ success: true, data: { message: 'Note deleted' } });
});

module.exports = { getUsers, getUser, getUserNotes, deleteUser, deleteNote };
