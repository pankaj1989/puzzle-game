const mongoose = require('mongoose');

const premiumPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
  stripeCustomerId: { type: String, required: true, index: true },
  stripeCheckoutSessionId: { type: String, default: null, sparse: true,  index: true },
  stripePaymentIntentId: { type: String, default: null, index: true },
  status: {
    type: String,
    enum: ['paid', 'refunded', 'pending'],
    required: true,
  },
  amountCents: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, lowercase: true, trim: true },
  priceId: { type: String, default: null },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('PremiumPurchase', premiumPurchaseSchema);
