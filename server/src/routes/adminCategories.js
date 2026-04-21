const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { createCategorySchema, updateCategorySchema } = require('../validators/adminCategoryValidators');
const controller = require('../controllers/adminCategoryController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.post('/', validate(createCategorySchema), asyncHandler(controller.create));
router.patch('/:id', validate(updateCategorySchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
