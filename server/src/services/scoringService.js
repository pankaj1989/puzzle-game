const DIFFICULTY_MULT = { easy: 1, medium: 1.5, hard: 2 };

function normalizeAnswer(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function calculateScore({ puzzle, elapsedSec, hintsUsed, wrongGuesses }) {
  const timeBonus = Math.max(0.1, 1 - elapsedSec / puzzle.timeLimitSeconds);
  const diffMult = DIFFICULTY_MULT[puzzle.difficulty] || 1;
  const hintPenalty = Math.max(0.1, 1 - hintsUsed * 0.15);
  const wrongPenalty = Math.max(0.3, 1 - wrongGuesses * 0.1);
  const raw = puzzle.basePoints * timeBonus * diffMult * hintPenalty * wrongPenalty;
  return Math.max(0, Math.round(raw));
}

module.exports = { calculateScore, normalizeAnswer };
