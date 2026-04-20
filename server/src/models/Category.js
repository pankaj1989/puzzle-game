const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: /^[a-z0-9-]+$/,
  },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: null, trim: true },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
