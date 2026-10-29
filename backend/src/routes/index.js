const router = require('express').Router();

// Also reachable through Nginx, which only forwards /api to this server
router.get('/health', (req, res) =>
  res.json({ success: true, message: 'OK', data: { uptime: Math.round(process.uptime()) } }),
);

router.use('/categories', require('../modules/categories/categories.routes'));
router.use('/products', require('../modules/products/products.routes'));
router.use('/bookings', require('../modules/bookings/bookings.routes'));
router.use('/transactions', require('../modules/transactions/transactions.routes'));
router.use('/reports', require('../modules/reports/reports.routes'));

module.exports = router;
