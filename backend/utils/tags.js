const ApiError = require('./ApiError');

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 30;

// "  #React  " -> "react"; removes duplicates and empty values.
const normalizeTags = (tags) => {
  if (tags === undefined || tags === null) return [];
  if (!Array.isArray(tags)) throw new ApiError(400, 'Tags must be an array of strings');

  const cleaned = [];
  for (const raw of tags) {
    if (typeof raw !== 'string') throw new ApiError(400, 'Tags must be an array of strings');
    const tag = raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ').toLowerCase();
    if (!tag) continue;
    if (tag.length > MAX_TAG_LENGTH) {
      throw new ApiError(400, `Each tag must be at most ${MAX_TAG_LENGTH} characters`);
    }
    if (!cleaned.includes(tag)) cleaned.push(tag);
  }
  if (cleaned.length > MAX_TAGS) throw new ApiError(400, `A note can have at most ${MAX_TAGS} tags`);
  return cleaned;
};

module.exports = { normalizeTags };
