const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authLimiter, magicLinkLimiter } = require('../middleware/rateLimit');
const { signupSchema, loginSchema, refreshSchema, magicLinkRequestSchema, magicLinkVerifySchema, googleSchema } = require('../validators/authValidators');
const authController = require('../controllers/authController');

router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', validate(refreshSchema), asyncHandler(authController.logout));
router.post('/magic/request', magicLinkLimiter, validate(magicLinkRequestSchema), asyncHandler(authController.magicRequest));
router.post('/magic/verify', validate(magicLinkVerifySchema), asyncHandler(authController.magicVerify));
router.post('/google', validate(googleSchema), asyncHandler(authController.google));

module.exports = router;
