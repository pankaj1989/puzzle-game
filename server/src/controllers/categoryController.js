const Category = require('../models/Category');
const { serializeCategory } = require('../services/categorySerializer');

async function listCategories(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories: categories.map((category) => serializeCategory(req, category)) });
}

module.exports = { listCategories };
