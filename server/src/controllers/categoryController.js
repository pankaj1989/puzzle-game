const Category = require('../models/Category');

async function listCategories(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories });
}

module.exports = { listCategories };
