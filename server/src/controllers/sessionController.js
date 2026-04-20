const GameSession = require('../models/GameSession');
const { pickRandomPuzzle } = require('../services/puzzleService');
const { HttpError } = require('../middleware/errorHandler');

function serializePuzzle(puzzle) {
  return {
    id: puzzle._id,
    plate: puzzle.plate,
    categoryId: puzzle.categoryId,
    difficulty: puzzle.difficulty,
    clue: puzzle.clue,
    revealSequence: puzzle.revealSequence,
    basePoints: puzzle.basePoints,
    timeLimitSeconds: puzzle.timeLimitSeconds,
  };
}

function serializeSession(session) {
  return {
    id: session._id,
    userId: session.userId,
    puzzleId: session.puzzleId,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    solved: session.solved,
    score: session.score,
    hintsUsed: session.hintsUsed,
    wrongGuesses: session.wrongGuesses,
    finalGuess: session.finalGuess,
  };
}

async function startSession(req, res) {
  const { categorySlug } = req.body;
  const isFree = req.user.plan !== 'premium';

  if (isFree && categorySlug) {
    throw new HttpError(403, 'Premium plan required to choose a category', 'PLAN_REQUIRED');
  }

  const puzzle = await pickRandomPuzzle({
    categorySlug,
    freeOnly: isFree,
  });
  if (!puzzle) throw new HttpError(404, 'No puzzle available', 'NO_PUZZLE_AVAILABLE');

  const session = await GameSession.create({
    userId: req.user._id,
    puzzleId: puzzle._id,
  });

  res.status(201).json({
    session: serializeSession(session),
    puzzle: serializePuzzle(puzzle),
  });
}

module.exports = { startSession, serializeSession, serializePuzzle };
