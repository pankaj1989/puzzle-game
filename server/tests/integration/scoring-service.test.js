const { calculateScore, normalizeAnswer } = require('../../src/services/scoringService');

describe('scoringService.normalizeAnswer', () => {
  it('lowercases, trims, collapses spaces', () => {
    expect(normalizeAnswer('  LOVE   TOMORROW  ')).toBe('love tomorrow');
  });
  it('handles null/undefined', () => {
    expect(normalizeAnswer(null)).toBe('');
    expect(normalizeAnswer(undefined)).toBe('');
  });
});

describe('scoringService.calculateScore', () => {
  const puzzle = { basePoints: 100, difficulty: 'easy', timeLimitSeconds: 60 };

  it('returns basePoints when solved instantly with no hints or wrongs', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(100);
  });

  it('halves score at half the time limit', () => {
    const s = calculateScore({ puzzle, elapsedSec: 30, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(50);
  });

  it('applies difficulty multiplier', () => {
    const hardPuzzle = { ...puzzle, difficulty: 'hard' };
    const s = calculateScore({ puzzle: hardPuzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(200);
  });

  it('applies hint penalty (1 hint = 15% off)', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 1, wrongGuesses: 0 });
    expect(s).toBe(85);
  });

  it('applies wrong-guess penalty (2 wrongs = 20% off)', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 2 });
    expect(s).toBe(80);
  });

  it('clamps time bonus to 10% minimum', () => {
    const s = calculateScore({ puzzle, elapsedSec: 999, hintsUsed: 0, wrongGuesses: 0 });
    expect(s).toBe(10);
  });

  it('clamps wrong-guess penalty to 30% minimum', () => {
    const s = calculateScore({ puzzle, elapsedSec: 0, hintsUsed: 0, wrongGuesses: 99 });
    expect(s).toBe(30);
  });

  it('never returns negative', () => {
    const s = calculateScore({ puzzle, elapsedSec: 9999, hintsUsed: 99, wrongGuesses: 99 });
    expect(s).toBeGreaterThanOrEqual(0);
  });
});
