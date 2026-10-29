const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const reportsService = require('./reports.service');

const getSummary = asyncHandler(async (req, res) => {
  const data = await reportsService.getSummary(req.query);
  success(res, { message: 'Sales summary', data });
});

const getTopProducts = asyncHandler(async (req, res) => {
  const data = await reportsService.getTopProducts(req.query);
  success(res, { message: 'Top products', data });
});

const getLowStock = asyncHandler(async (req, res) => {
  const data = await reportsService.getLowStock(req.query);
  success(res, { message: 'Low stock products', data });
});

const getSales = asyncHandler(async (req, res) => {
  const data = await reportsService.getSales(req.query);
  success(res, { message: 'Sales report', data });
});

const exportReport = asyncHandler(async (req, res) => {
  const { filename, csv } = await reportsService.exportReport(req.query);
  res.attachment(filename).type('text/csv').send(csv);
});

const getBookingSummary = asyncHandler(async (req, res) => {
  const data = await reportsService.getBookingSummary(req.query);
  success(res, { message: 'Booking summary from booking-api', data });
});

module.exports = { getSummary, getTopProducts, getLowStock, getSales, exportReport, getBookingSummary };
