const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { authenticate, optionalAuthenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const controller = require('./products.controller');
const {
  listProductsSchema,
  productIdSchema,
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  listMovementsSchema,
} = require('./products.schema');

const adminOnly = [authenticate, authorize('ADMIN')];

// Static paths come before /:id so "stock-movements" is not read as an id
router.get('/', optionalAuthenticate, validate(listProductsSchema), controller.listProducts);
router.get('/stock-movements', adminOnly, validate(listMovementsSchema), controller.listStockMovements);
router.get('/:id', optionalAuthenticate, validate(productIdSchema), controller.getProduct);
router.post('/', adminOnly, validate(createProductSchema), controller.createProduct);
router.patch('/:id', adminOnly, validate(updateProductSchema), controller.updateProduct);
router.delete('/:id', adminOnly, validate(productIdSchema), controller.deleteProduct);
router.post('/:id/stock', adminOnly, validate(adjustStockSchema), controller.adjustStock);
router.get('/:id/stock-movements', adminOnly, validate(listMovementsSchema), controller.listStockMovements);

module.exports = router;
