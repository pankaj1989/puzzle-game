const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { updateProfileSchema } = require('../validators/profileValidators');
const controller = require('../controllers/profileController');

router.get('/', authRequired(), asyncHandler(controller.getProfile));
router.patch(
  '/',
  authRequired(),
  validate(updateProfileSchema),
  asyncHandler(controller.updateProfile)
);

module.exports = router;
