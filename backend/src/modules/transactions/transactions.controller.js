const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const transactionsService = require('./transactions.service');

const createCashierSale = asyncHandler(async (req, res) => {
  const data = await transactionsService.createCashierSale(req.body, req.user);
  success(res, { statusCode: 201, message: 'Sale completed', data });
});

const createSelfOrder = asyncHandler(async (req, res) => {
  const data = await transactionsService.createSelfOrder(req.body, req.user);
  success(res, { statusCode: 201, message: 'Order placed, please pay at the counter', data });
});

const listMyTransactions = asyncHandler(async (req, res) => {
  const { items, meta } = await transactionsService.listMyTransactions(req.user.id, req.query);
  success(res, { message: 'My orders', data: items, meta });
});

const listTransactions = asyncHandler(async (req, res) => {
  const { items, meta } = await transactionsService.listTransactions(req.query);
  success(res, { message: 'Transaction list', data: items, meta });
});

const getTransaction = asyncHandler(async (req, res) => {
  const data = await transactionsService.getTransactionById(req.params.id, req.user);
  success(res, { message: 'Transaction detail', data });
});

const payTransaction = asyncHandler(async (req, res) => {
  const data = await transactionsService.payTransaction(req.params.id, req.body, req.user);
  success(res, { message: 'Payment recorded', data });
});

const cancelTransaction = asyncHandler(async (req, res) => {
  const data = await transactionsService.cancelTransaction(req.params.id, req.user, req.body.reason);
  success(res, { message: 'Order cancelled', data });
});

const lookupBooking = asyncHandler(async (req, res) => {
  const data = await transactionsService.lookupBooking(req.params.code);
  success(res, { message: 'Booking detail', data });
});

module.exports = {
  createCashierSale,
  createSelfOrder,
  listMyTransactions,
  listTransactions,
  getTransaction,
  payTransaction,
  cancelTransaction,
  lookupBooking,
};
