const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { uploadCategoryImage, normalizeCategoryBody } = require('../middleware/categoryUpload');
const { createCategorySchema, updateCategorySchema } = require('../validators/adminCategoryValidators');
const controller = require('../controllers/adminCategoryController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.post('/', uploadCategoryImage, normalizeCategoryBody, validate(createCategorySchema), asyncHandler(controller.create));
router.patch('/:id', uploadCategoryImage, normalizeCategoryBody, validate(updateCategorySchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
