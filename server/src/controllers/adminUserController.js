const User = require('../models/User');
const { HttpError } = require('../middleware/errorHandler');
const { listQuery } = require('../validators/adminUserValidators');

async function list(req, res) {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, 'Invalid query', 'VALIDATION_ERROR');
  const { page, limit, q } = parsed.data;
  const filter = {};
  if (q) filter.email = { $regex: q.toLowerCase(), $options: 'i' };
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ users, total, page, limit });
}

async function update(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.plan !== undefined) user.plan = req.body.plan;
  await user.save();
  res.json({ user });
}

module.exports = { list, update };
