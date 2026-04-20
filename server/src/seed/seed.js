/* eslint-disable no-console */
const env = require('../config/env');
const { connect, disconnect } = require('../config/db');
const Category = require('../models/Category');
const Puzzle = require('../models/Puzzle');
const seedData = require('./seed-data');

async function run() {
  console.log(`Seeding to ${env.MONGODB_URI}`);
  await connect();

  for (const cat of seedData.categories) {
    await Category.updateOne({ slug: cat.slug }, { $set: cat }, { upsert: true });
  }
  console.log(`Upserted ${seedData.categories.length} categories`);

  for (const p of seedData.puzzles) {
    const category = await Category.findOne({ slug: p.categorySlug });
    if (!category) {
      console.warn(`Skipping puzzle ${p.plate}: category ${p.categorySlug} not found`);
      continue;
    }
    const { categorySlug, ...puzzleFields } = p;
    await Puzzle.updateOne(
      { plate: p.plate.toUpperCase() },
      { $set: { ...puzzleFields, categoryId: category._id } },
      { upsert: true }
    );
  }
  console.log(`Upserted ${seedData.puzzles.length} puzzles`);

  await disconnect();
  console.log('Done.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
