const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/leaderboardController');

// /me MUST be declared before /:window
router.get('/me', authRequired(), asyncHandler(controller.me));
router.get('/:window', asyncHandler(controller.list));

module.exports = router;
