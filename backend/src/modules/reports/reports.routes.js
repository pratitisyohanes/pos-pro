const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const controller = require('./reports.controller');
const { summarySchema, topListSchema, lowStockSchema, salesSchema, exportSchema } = require('./reports.schema');

router.use(authenticate, authorize('ADMIN'));

router.get('/summary', validate(summarySchema), controller.getSummary);
router.get('/top-products', validate(topListSchema), controller.getTopProducts);
router.get('/low-stock', validate(lowStockSchema), controller.getLowStock);
router.get('/sales', validate(salesSchema), controller.getSales);
router.get('/export', validate(exportSchema), controller.exportReport);
router.get('/booking-summary', validate(summarySchema), controller.getBookingSummary);

module.exports = router;
