const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const controller = require('../controllers/categoryController');

router.get('/', asyncHandler(controller.listCategories));

module.exports = router;
