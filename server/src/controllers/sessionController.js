const GameSession = require('../models/GameSession');
const Puzzle = require('../models/Puzzle');
const { pickRandomPuzzle } = require('../services/puzzleService');
const { calculateScore, normalizeAnswer } = require('../services/scoringService');
const { computeStreakUpdate } = require('../services/streakService');
const { mongoIdSchema, listSessionsQuery } = require('../validators/sessionValidators');
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

  const streakUpdate = computeStreakUpdate({
    lastPlayedDay: req.user.lastPlayedDay,
    currentStreak: req.user.currentStreak,
    longestStreak: req.user.longestStreak,
    now: new Date(),
  });
  req.user.currentStreak = streakUpdate.currentStreak;
  req.user.longestStreak = streakUpdate.longestStreak;
  req.user.lastPlayedDay = streakUpdate.lastPlayedDay;
  req.user.totalScore = (req.user.totalScore || 0) + score;
  await req.user.save();

  res.json({
    solved: true,
    score,
    correctAnswer: puzzle.answer,
    session: serializeSession(session),
  });
}

async function requestHint(req, res) {
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

  if (session.hintsUsed >= puzzle.revealSequence.length) {
    throw new HttpError(409, 'No more hints available', 'NO_MORE_HINTS');
  }

  const index = puzzle.revealSequence[session.hintsUsed];
  const letter = puzzle.answer.charAt(index).toUpperCase();

  session.hintsUsed += 1;
  await session.save();

  res.json({ hintsUsed: session.hintsUsed, nextHint: { index, letter } });
}

async function listMySessions(req, res) {
  const parsed = listSessionsQuery.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'Invalid query', 'VALIDATION_ERROR');
  const { page, limit } = parsed.data;
  const filter = { userId: req.user._id };
  const [sessions, total] = await Promise.all([
    GameSession.find(filter).sort({ startedAt: -1 }).skip((page - 1) * limit).limit(limit),
    GameSession.countDocuments(filter),
  ]);
  res.json({ total, sessions: sessions.map(serializeSession), page, limit });
}

async function getSession(req, res) {
  const idCheck = mongoIdSchema.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid session id', 'INVALID_ID');
  const session = await GameSession.findById(req.params.id);
  if (!session) throw new HttpError(404, 'Session not found', 'NOT_FOUND');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new HttpError(403, 'Forbidden', 'FORBIDDEN');
  }
  res.json({ session: serializeSession(session) });
}

module.exports = {
  startSession,
  submitGuess,
  requestHint,
  listMySessions,
  getSession,
  serializeSession,
  serializePuzzle,
};
