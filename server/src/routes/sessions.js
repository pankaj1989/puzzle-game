const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { startSessionSchema, guessSchema } = require('../validators/sessionValidators');
const controller = require('../controllers/sessionController');

router.post(
  '/start',
  authRequired(),
  validate(startSessionSchema),
  asyncHandler(controller.startSession)
);

router.post(
  '/:id/guess',
  authRequired(),
  validate(guessSchema),
  asyncHandler(controller.submitGuess)
);

router.post('/:id/hint', authRequired(), asyncHandler(controller.requestHint));

module.exports = router;
