const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { createPuzzleSchema, updatePuzzleSchema } = require('../validators/adminPuzzleValidators');
const controller = require('../controllers/adminPuzzleController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getOne));
router.post('/', validate(createPuzzleSchema), asyncHandler(controller.create));
router.patch('/:id', validate(updatePuzzleSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
