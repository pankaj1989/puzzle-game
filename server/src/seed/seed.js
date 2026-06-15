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
    await Category.updateOne({ name: cat.name }, { $set: cat }, { upsert: true });
    const doc = await Category.findOne({ name: cat.name });
    if (doc && !doc.slug) await doc.save();
  }
  console.log(`Upserted ${seedData.categories.length} categories`);

  for (const p of seedData.puzzles) {
    const category = await Category.findOne({ name: p.categoryName });
    if (!category) {
      console.warn(`Skipping puzzle ${p.plate}: category ${p.categoryName} not found`);
      continue;
    }
    const { categoryName, ...puzzleFields } = p;
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
