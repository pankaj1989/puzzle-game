const { registerHooks } = require('../testSetup');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const { pickRandomPuzzle } = require('../../src/services/puzzleService');

registerHooks();

async function seedFixtures() {
  const movies = await Category.create({ slug: 'movies', name: 'Movies', isPremium: false });
  const music = await Category.create({ slug: 'music', name: 'Music', isPremium: true });
  await Puzzle.create({
    plate: 'A1', answer: 'a', categoryId: movies._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0, 1], isPremium: false,
  });
  await Puzzle.create({
    plate: 'A2', answer: 'b', categoryId: movies._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0, 1], isPremium: true,
  });
  await Puzzle.create({
    plate: 'A3', answer: 'c', categoryId: music._id, difficulty: 'easy',
    clue: 'x', revealSequence: [0, 1], isPremium: true,
  });
  return { movies, music };
}

describe('puzzleService.pickRandomPuzzle', () => {
  it('returns any non-premium puzzle when { freeOnly: true }', async () => {
    await seedFixtures();
    const p = await pickRandomPuzzle({ freeOnly: true });
    expect(p).not.toBeNull();
    expect(p.isPremium).toBe(false);
  });

  it('filters by categoryId when provided', async () => {
    const { music } = await seedFixtures();
    const p = await pickRandomPuzzle({ categoryId: music._id, freeOnly: false });
    expect(p.categoryId.toString()).toBe(music._id.toString());
  });

  it('returns null when no puzzle matches', async () => {
    const p = await pickRandomPuzzle({ categoryId: '507f1f77bcf86cd799439011', freeOnly: false });
    expect(p).toBeNull();
  });

  it('never returns premium when freeOnly is true, even with premium categoryId', async () => {
    await seedFixtures();
    const premiumCategory = await Category.findOne({ slug: 'music' });
    const p = await pickRandomPuzzle({ categoryId: premiumCategory._id, freeOnly: true });
    // music category only has premium puzzles → should be null
    expect(p).toBeNull();
  });

  it('never returns puzzle from premium category in free mode', async () => {
    const premiumCategory = await Category.create({ slug: 'vip', name: 'Vip', isPremium: true });
    await Puzzle.create({
      plate: 'VIP42', answer: 'vip', categoryId: premiumCategory._id, difficulty: 'easy',
      clue: 'x', revealSequence: [0, 1], isPremium: false,
    });

    const p = await pickRandomPuzzle({ freeOnly: true });
    expect(p).toBeNull();
  });
});
