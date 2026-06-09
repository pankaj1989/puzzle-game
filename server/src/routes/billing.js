const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { confirmPaymentSchema } = require('../validators/billingValidators');
const controller = require('../controllers/billingController');

router.post('/payment-intent', authRequired(), asyncHandler(controller.createPaymentIntent));
router.post(
  '/confirm-payment',
  authRequired(),
  validate(confirmPaymentSchema),
  asyncHandler(controller.confirmPayment)
);
router.post('/simulate-success', authRequired(), asyncHandler(controller.simulateSuccess));
router.get('/purchase', authRequired(), asyncHandler(controller.getPurchase));
router.post('/receipt', authRequired(), asyncHandler(controller.receipt));

module.exports = router;
