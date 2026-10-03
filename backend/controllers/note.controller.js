const mongoose = require('mongoose');
const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { normalizeTags } = require('../utils/tags');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid note ID');
};

// Validates only the fields present in the body. Returns a whitelisted update object.
const parseNoteBody = (body, { requireAny }) => {
  const data = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') throw new ApiError(400, 'Title must be a string');
    const title = body.title.trim();
    if (title.length > 200) throw new ApiError(400, 'Title must be at most 200 characters');
    data.title = title || 'Untitled';
  }
  if (body.content !== undefined) {
    if (typeof body.content !== 'string') throw new ApiError(400, 'Content must be a string');
    if (body.content.length > 100000) throw new ApiError(400, 'Content is too long');
    data.content = body.content;
  }
  if (body.tags !== undefined) data.tags = normalizeTags(body.tags);

  if (requireAny && Object.keys(data).length === 0) {
    throw new ApiError(400, 'Provide at least one of: title, content, tags');
  }
  return data;
};

// GET /api/notes?search=&tag=  - ONLY the authenticated user's notes.
const getNotes = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };

  const { search, tag } = req.query;
  if (typeof search === 'string' && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: regex }, { content: regex }];
  }
  if (typeof tag === 'string' && tag.trim()) {
    filter.tags = tag.trim().replace(/^#+/, '').toLowerCase();
  }

  const notes = await Note.find(filter).sort({ updatedAt: -1 });
  res.json({ success: true, data: { count: notes.length, notes } });
});

// GET /api/notes/tags - distinct tags (with counts) used by the authenticated user.
const getTags = asyncHandler(async (req, res) => {
  const rows = await Note.aggregate([
    { $match: { user: req.user._id } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, data: { tags: rows.map((r) => ({ name: r._id, count: r.count })) } });
});

// GET /api/notes/:id
const getNote = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ success: true, data: { note } });
});

// POST /api/notes - owner always comes from the JWT, never from the body.
const createNote = asyncHandler(async (req, res) => {
  const data = parseNoteBody(req.body, { requireAny: false });
  const note = await Note.create({ ...data, user: req.user._id });
  res.status(201).json({ success: true, data: { note } });
});

// PATCH /api/notes/:id
const updateNote = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const data = parseNoteBody(req.body, { requireAny: true });

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ success: true, data: { note } });
});

// DELETE /api/notes/:id
const deleteNote = asyncHandler(async (req, res) => {
  assertValidId(req.params.id);
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ success: true, data: { message: 'Note deleted' } });
});

module.exports = { getNotes, getTags, getNote, createNote, updateNote, deleteNote };
