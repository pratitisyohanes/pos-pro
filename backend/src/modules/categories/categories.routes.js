const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const controller = require('./categories.controller');
const {
  listCategoriesSchema,
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} = require('./categories.schema');

const adminOnly = [authenticate, authorize('ADMIN')];

router.get('/', validate(listCategoriesSchema), controller.listCategories);
router.get('/:id', validate(categoryIdSchema), controller.getCategory);
router.post('/', adminOnly, validate(createCategorySchema), controller.createCategory);
router.patch('/:id', adminOnly, validate(updateCategorySchema), controller.updateCategory);
router.delete('/:id', adminOnly, validate(categoryIdSchema), controller.deleteCategory);

module.exports = router;
