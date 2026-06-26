const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { startSessionSchema, guessSchema } = require('../validators/sessionValidators');
const controller = require('../controllers/sessionController');

const sessionAuth = authRequired({ allowGuest: true });

router.post(
  '/start',
  sessionAuth,
  validate(startSessionSchema),
  asyncHandler(controller.startSession)
);

router.post(
  '/:id/guess',
  sessionAuth,
  validate(guessSchema),
  asyncHandler(controller.submitGuess)
);

router.post('/:id/hint', sessionAuth, asyncHandler(controller.requestHint));

router.get('/me', authRequired(), asyncHandler(controller.listMySessions));
router.get('/:id/share', sessionAuth, asyncHandler(controller.getShare));
router.get('/:id', sessionAuth, asyncHandler(controller.getSession));

module.exports = router;
