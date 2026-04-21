const router = require('express').Router();
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const authRequired = require('../middleware/authRequired');
const { updateUserSchema } = require('../validators/adminUserValidators');
const controller = require('../controllers/adminUserController');

router.use(authRequired({ roles: ['admin'] }));
router.get('/', asyncHandler(controller.list));
router.patch('/:id', validate(updateUserSchema), asyncHandler(controller.update));

module.exports = router;
