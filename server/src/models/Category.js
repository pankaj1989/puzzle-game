const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
 
  name: { type: String, required: true, trim: true },
  image: { type: String, default: null, trim: true },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
