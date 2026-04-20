const { registerHooks } = require('../testSetup');
const mongoose = require('mongoose');
const GameSession = require('../../src/models/GameSession');

registerHooks();

describe('GameSession model', () => {
  it('creates with sane defaults', async () => {
    const userId = new mongoose.Types.ObjectId();
    const puzzleId = new mongoose.Types.ObjectId();
    const s = await GameSession.create({ userId, puzzleId });
    expect(s.solved).toBe(false);
    expect(s.score).toBeNull();
    expect(s.hintsUsed).toBe(0);
    expect(s.wrongGuesses).toBe(0);
    expect(s.completedAt).toBeNull();
    expect(s.startedAt).toBeInstanceOf(Date);
  });

  it('requires userId and puzzleId', async () => {
    await expect(GameSession.create({})).rejects.toThrow();
  });
});
