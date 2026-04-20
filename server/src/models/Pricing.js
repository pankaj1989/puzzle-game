const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  stripePriceId: { type: String, required: true, trim: true, index: true },
  amountCents: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, lowercase: true, trim: true, minlength: 3, maxlength: 3 },
  interval: { type: String, enum: ['month', 'year'], required: true },
  active: { type: Boolean, default: true, index: true },
}, { timestamps: true });

pricingSchema.statics.getActive = function () {
  return this.findOne({ active: true }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Pricing', pricingSchema);
