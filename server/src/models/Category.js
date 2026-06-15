const mongoose = require('mongoose');
const { ensureUniqueSlug } = require('../services/categorySlugService');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  image: { type: String, default: null, trim: true },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

categorySchema.pre('validate', async function assignSlug() {
  if (!this.isModified('name') && this.slug) return;
  this.slug = await ensureUniqueSlug(this.name, this._id, this.constructor);
});

module.exports = mongoose.model('Category', categorySchema);
