const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { startSessionSchema } = require('../validators/sessionValidators');
const controller = require('../controllers/sessionController');

router.post(
  '/start',
  authRequired(),
  validate(startSessionSchema),
  asyncHandler(controller.startSession)
);

module.exports = router;
