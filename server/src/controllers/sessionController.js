const GameSession = require('../models/GameSession');
const Puzzle = require('../models/Puzzle');
const { pickRandomPuzzle } = require('../services/puzzleService');
const { calculateScore, normalizeAnswer } = require('../services/scoringService');
const { mongoIdSchema } = require('../validators/sessionValidators');
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

async function submitGuess(req, res) {
  const idCheck = mongoIdSchema.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid session id', 'INVALID_ID');
  const session = await GameSession.findById(req.params.id);
  if (!session) throw new HttpError(404, 'Session not found', 'NOT_FOUND');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }
  if (session.completedAt) throw new HttpError(409, 'Session already completed', 'SESSION_COMPLETED');

  const puzzle = await Puzzle.findById(session.puzzleId);
  if (!puzzle) throw new HttpError(404, 'Puzzle not found', 'NOT_FOUND');

  const normalizedGuess = normalizeAnswer(req.body.guess);
  const correct = normalizedGuess === puzzle.answer;

  if (!correct) {
    session.wrongGuesses += 1;
    await session.save();
    return res.json({
      solved: false,
      session: serializeSession(session),
    });
  }

  const elapsedSec = Math.max(0, (Date.now() - session.startedAt.getTime()) / 1000);
  const score = calculateScore({
    puzzle,
    elapsedSec,
    hintsUsed: session.hintsUsed,
    wrongGuesses: session.wrongGuesses,
  });

  session.solved = true;
  session.score = score;
  session.completedAt = new Date();
  session.finalGuess = normalizedGuess;
  await session.save();

  res.json({
    solved: true,
    score,
    correctAnswer: puzzle.answer,
    session: serializeSession(session),
  });
}

module.exports = { startSession, submitGuess, serializeSession, serializePuzzle };
