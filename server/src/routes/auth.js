const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { signupSchema } = require('../validators/authValidators');
const authController = require('../controllers/authController');

router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));

module.exports = router;
