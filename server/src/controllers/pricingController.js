const Pricing = require('../models/Pricing');

async function getActive(req, res) {
  const pricing = await Pricing.getActive();
  res.json({ pricing });
}

async function upsert(req, res) {
  const { stripePriceId, amountCents, currency, interval } = req.body;
  await Pricing.updateMany({ active: true }, { $set: { active: false } });
  const pricing = await Pricing.create({ stripePriceId, amountCents, currency, interval, active: true });
  res.status(201).json({ pricing });
}

async function listAll(req, res) {
  const pricing = await Pricing.find().sort({ createdAt: -1 });
  res.json({ pricing });
}

module.exports = { getActive, upsert, listAll };
