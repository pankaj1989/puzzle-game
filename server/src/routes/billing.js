const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/billingController');

router.post('/checkout', authRequired(), asyncHandler(controller.checkout));

module.exports = router;
