const { registerHooks } = require('../testSetup');
const Puzzle = require('../../src/models/Puzzle');
const Category = require('../../src/models/Category');

registerHooks();

describe('Puzzle model', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ slug: 'movies', name: 'Movies' });
  });

  it('creates a puzzle with defaults', async () => {
    const p = await Puzzle.create({
      plate: 'LUV2MRO',
      answer: 'love tomorrow',
      categoryId: category._id,
      difficulty: 'easy',
      clue: 'Feeling for the next day',
      revealSequence: [3, 1, 5, 0, 2, 4, 6],
    });
    expect(p.plate).toBe('LUV2MRO');
    expect(p.answer).toBe('love tomorrow');
    expect(p.basePoints).toBe(100);
    expect(p.timeLimitSeconds).toBe(60);
    expect(p.isPremium).toBe(false);
  });

  it('normalizes plate to uppercase and answer to lowercase on save', async () => {
    const p = await Puzzle.create({
      plate: ' luv2mro ',
      answer: '  LOVE  TOMORROW  ',
      categoryId: category._id,
      difficulty: 'easy',
      clue: 'x',
      revealSequence: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(p.plate).toBe('LUV2MRO');
    expect(p.answer).toBe('love tomorrow');
  });

  it('requires difficulty be one of the enum values', async () => {
    await expect(Puzzle.create({
      plate: 'X', answer: 'x',
      categoryId: category._id,
      difficulty: 'impossible',
      clue: 'x',
      revealSequence: [0],
    })).rejects.toThrow();
  });
});
