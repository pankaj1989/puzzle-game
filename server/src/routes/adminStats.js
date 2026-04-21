const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const authRequired = require('../middleware/authRequired');
const controller = require('../controllers/adminStatsController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.stats));

module.exports = router;
