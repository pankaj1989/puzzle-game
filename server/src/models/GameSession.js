const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  puzzleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Puzzle', required: true, index: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  solved: { type: Boolean, default: false },
  score: { type: Number, default: null, min: 0 },
  hintsUsed: { type: Number, default: 0, min: 0 },
  wrongGuesses: { type: Number, default: 0, min: 0 },
  finalGuess: { type: String, default: null },
}, { timestamps: true });

gameSessionSchema.index({ userId: 1, startedAt: -1 });
gameSessionSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
