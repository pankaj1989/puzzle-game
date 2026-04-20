const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { upsertPricingSchema } = require('../validators/billingValidators');
const controller = require('../controllers/pricingController');

router.get('/pricing', asyncHandler(controller.getActive));
router.post(
  '/admin/pricing',
  authRequired({ roles: ['admin'] }),
  validate(upsertPricingSchema),
  asyncHandler(controller.upsert)
);

module.exports = router;
