const mongoose = require('mongoose');

function normalizeAnswer(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

const puzzleSchema = new mongoose.Schema({
  plate: {
    type: String, required: true, trim: true,
    set: (v) => String(v || '').trim().toUpperCase(),
  },
  answer: {
    type: String, required: true, trim: true,
    set: normalizeAnswer,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  clue: { type: String, required: true, trim: true },
  revealSequence: {
    type: [Number],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0,
  },
  basePoints: { type: Number, default: 100, min: 0 },
  timeLimitSeconds: { type: Number, default: 60, min: 5 },
  isPremium: { type: Boolean, default: false, index: true },
}, { timestamps: true });

puzzleSchema.index({ isPremium: 1, categoryId: 1 });

module.exports = mongoose.model('Puzzle', puzzleSchema);
