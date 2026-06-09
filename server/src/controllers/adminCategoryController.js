const Category = require('../models/Category');
const Puzzle = require('../models/Puzzle');
const { HttpError } = require('../middleware/errorHandler');
const { serializeCategory, toStoredImagePath } = require('../services/categorySerializer');

async function list(req, res) {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ categories: categories });
}

async function create(req, res) {
  try {
    
    const category = await Category.create({
      ...req.body,
      image: req.file ? toStoredImagePath(req.file) : null,
    });
    res.status(201).json({ category: serializeCategory(req, category) });
  } catch (err) {

    console.log("zdcvcx",err)
    if (err.code === 11000) throw new HttpError(409, 'Category already exists', 'CATEGORY_EXISTS');
    throw err;
  }
}

async function update(req, res) {
  const cat = await Category.findById(req.params.id);
  if (!cat) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  Object.assign(cat, req.body);
  if (req.file) {
    cat.image = toStoredImagePath(req.file);
  }
  await cat.save();
  res.json({ category: serializeCategory(req, cat) });
}

async function remove(req, res) {
  const hasPuzzles = await Puzzle.exists({ categoryId: req.params.id });
  if (hasPuzzles) throw new HttpError(409, 'Category has puzzles', 'CATEGORY_HAS_PUZZLES');
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.status(204).end();
}

module.exports = { list, create, update, remove };
