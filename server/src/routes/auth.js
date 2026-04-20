const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authLimiter, magicLinkLimiter } = require('../middleware/rateLimit');
const { signupSchema, loginSchema, refreshSchema, magicLinkRequestSchema, magicLinkVerifySchema, googleSchema } = require('../validators/authValidators');
const authController = require('../controllers/authController');
const authRequired = require('../middleware/authRequired');

router.post('/signup', authLimiter, validate(signupSchema), asyncHandler(authController.signup));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', authLimiter, validate(refreshSchema), asyncHandler(authController.refresh));
router.post('/logout', authLimiter, validate(refreshSchema), asyncHandler(authController.logout));
router.post('/magic/request', magicLinkLimiter, validate(magicLinkRequestSchema), asyncHandler(authController.magicRequest));
router.post('/magic/verify', validate(magicLinkVerifySchema), asyncHandler(authController.magicVerify));
router.post('/google', validate(googleSchema), asyncHandler(authController.google));
router.get('/me', authRequired(), asyncHandler(authController.me));

module.exports = router;
