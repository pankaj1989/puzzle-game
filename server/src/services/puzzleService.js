const Puzzle = require('../models/Puzzle');
const Category = require('../models/Category');

async function pickRandomPuzzle({ categoryId, freeOnly } = {}) {
  const filter = {};

  if (categoryId) {
    filter.categoryId = categoryId;
  }

  if (freeOnly) {
    filter.isPremium = false;
    const freeCategories = await Category.find({ isPremium: false }).select('_id');
    filter.categoryId = filter.categoryId || { $in: freeCategories.map((c) => c._id) };
  }

  const results = await Puzzle.aggregate([
    { $match: filter },
    { $sample: { size: 1 } },
  ]);
  if (results.length === 0) return null;
  return Puzzle.findById(results[0]._id);
}

module.exports = { pickRandomPuzzle };
