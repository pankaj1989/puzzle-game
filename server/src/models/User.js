const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null, index: true, sparse: true },
  displayName: { type: String, default: null, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  plan: { type: String, enum: ['free', 'premium'], default: 'free' },
  planExpiresAt: { type: Date, default: null },
  emailVerifiedAt: { type: Date, default: null },
  lastLoginAt: { type: Date, default: null },
  currentStreak: { type: Number, default: 0, min: 0 },
  longestStreak: { type: Number, default: 0, min: 0 },
  lastPlayedDay: { type: Date, default: null },
  totalScore: { type: Number, default: 0, min: 0, index: true },
}, { timestamps: true });

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
