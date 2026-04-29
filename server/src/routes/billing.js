const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/billingController');

router.post('/checkout', authRequired(), asyncHandler(controller.checkout));
router.post('/simulate-success', authRequired(), asyncHandler(controller.simulateSuccess));
router.post('/webhook', asyncHandler(controller.webhook));
router.get('/subscription', authRequired(), asyncHandler(controller.getSubscription));
router.post('/portal', authRequired(), asyncHandler(controller.portal));

module.exports = router;
