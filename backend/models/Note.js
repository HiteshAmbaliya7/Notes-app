const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title must be at most 200 characters'],
      default: 'Untitled',
    },
    content: {
      type: String,
      maxlength: [100000, 'Content is too long'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Notes list for a user, newest first (also covers queries on Note.user).
noteSchema.index({ user: 1, updatedAt: -1 });
// Tag filtering within a user's notes.
noteSchema.index({ user: 1, tags: 1 });

module.exports = mongoose.model('Note', noteSchema);
