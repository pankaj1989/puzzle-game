const Puzzle = require('../models/Puzzle');
const Category = require('../models/Category');

async function pickRandomPuzzle({ categorySlug, freeOnly } = {}) {
  const filter = {};
  if (freeOnly) filter.isPremium = false;
  if (categorySlug) {
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) return null;
    filter.categoryId = category._id;
  }
  const results = await Puzzle.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);
  if (results.length === 0) return null;
  return Puzzle.findById(results[0]._id);
}

module.exports = { pickRandomPuzzle };
