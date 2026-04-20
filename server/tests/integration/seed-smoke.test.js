const { registerHooks } = require('../testSetup');
const Category = require('../../src/models/Category');
const Puzzle = require('../../src/models/Puzzle');
const seedData = require('../../src/seed/seed-data');

registerHooks();

describe('seed data integrity', () => {
  it('has at least 6 categories', () => {
    expect(seedData.categories.length).toBeGreaterThanOrEqual(6);
  });

  it('has at least 15 puzzles', () => {
    expect(seedData.puzzles.length).toBeGreaterThanOrEqual(15);
  });

  it('every puzzle references a defined category slug', () => {
    const slugs = new Set(seedData.categories.map(c => c.slug));
    for (const p of seedData.puzzles) {
      expect(slugs.has(p.categorySlug)).toBe(true);
    }
  });

  it('revealSequence indices are valid for each puzzle answer', () => {
    for (const p of seedData.puzzles) {
      const maxIdx = p.answer.length - 1;
      for (const i of p.revealSequence) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThanOrEqual(maxIdx);
      }
    }
  });

  it('seed-data can be loaded into the DB', async () => {
    for (const cat of seedData.categories) {
      await Category.create(cat);
    }
    for (const p of seedData.puzzles) {
      const category = await Category.findOne({ slug: p.categorySlug });
      const { categorySlug, ...puzzleFields } = p;
      await Puzzle.create({ ...puzzleFields, categoryId: category._id });
    }
    const catCount = await Category.countDocuments();
    const puzCount = await Puzzle.countDocuments();
    expect(catCount).toBe(seedData.categories.length);
    expect(puzCount).toBe(seedData.puzzles.length);
  });
});
