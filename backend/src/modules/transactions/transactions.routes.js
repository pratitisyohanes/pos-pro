const router = require('express').Router();
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const controller = require('./transactions.controller');
const {
  cashierSaleSchema,
  selfOrderSchema,
  transactionIdSchema,
  payTransactionSchema,
  cancelTransactionSchema,
  listMyTransactionsSchema,
  listTransactionsSchema,
} = require('./transactions.schema');

router.use(authenticate);

router.post('/', authorize('ADMIN'), validate(cashierSaleSchema), controller.createCashierSale);
router.post('/self-order', authorize('USER'), validate(selfOrderSchema), controller.createSelfOrder);
router.get('/me', authorize('USER'), validate(listMyTransactionsSchema), controller.listMyTransactions);
router.get('/', authorize('ADMIN'), validate(listTransactionsSchema), controller.listTransactions);
router.get('/:id', validate(transactionIdSchema), controller.getTransaction);
router.patch('/:id/pay', authorize('ADMIN'), validate(payTransactionSchema), controller.payTransaction);
router.patch('/:id/cancel', validate(cancelTransactionSchema), controller.cancelTransaction);

module.exports = router;
