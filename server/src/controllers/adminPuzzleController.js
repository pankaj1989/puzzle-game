const Puzzle = require('../models/Puzzle');
const Category = require('../models/Category');
const { HttpError } = require('../middleware/errorHandler');
const { listPuzzlesQuery, mongoId } = require('../validators/adminPuzzleValidators');

async function list(req, res) {
  const parsed = listPuzzlesQuery.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'Invalid query', 'VALIDATION_ERROR');
  const { page, limit, categorySlug } = parsed.data;
  const filter = {};
  if (categorySlug) {
    const cat = await Category.findOne({ slug: categorySlug });
    if (!cat) return res.json({ puzzles: [], total: 0, page, limit });
    filter.categoryId = cat._id;
  }
  const [puzzles, total] = await Promise.all([
    Puzzle.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Puzzle.countDocuments(filter),
  ]);
  res.json({ puzzles, total, page, limit });
}

async function getOne(req, res) {
  const idCheck = mongoId.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid id', 'INVALID_ID');
  const puzzle = await Puzzle.findById(req.params.id);
  if (!puzzle) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.json({ puzzle });
}

async function create(req, res) {
  const puzzle = await Puzzle.create(req.body);
  res.status(201).json({ puzzle });
}

async function update(req, res) {
  const idCheck = mongoId.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid id', 'INVALID_ID');
  const puzzle = await Puzzle.findById(req.params.id);
  if (!puzzle) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  Object.assign(puzzle, req.body);
  await puzzle.save();
  res.json({ puzzle });
}

async function remove(req, res) {
  const idCheck = mongoId.safeParse(req.params.id);
  if (!idCheck.success) throw new HttpError(400, 'Invalid id', 'INVALID_ID');
  const puzzle = await Puzzle.findByIdAndDelete(req.params.id);
  if (!puzzle) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.status(204).end();
}

module.exports = { list, getOne, create, update, remove };
