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

  it('filters by category slug when provided', async () => {
    const { music } = await seedFixtures();
    const p = await pickRandomPuzzle({ categorySlug: 'music', freeOnly: false });
    expect(p.categoryId.toString()).toBe(music._id.toString());
  });

  it('returns null when no puzzle matches', async () => {
    const p = await pickRandomPuzzle({ categorySlug: 'nonexistent', freeOnly: false });
    expect(p).toBeNull();
  });

  it('never returns premium when freeOnly is true, even with categorySlug', async () => {
    await seedFixtures();
    const p = await pickRandomPuzzle({ categorySlug: 'music', freeOnly: true });
    // music category only has premium puzzles → should be null
    expect(p).toBeNull();
  });
});
