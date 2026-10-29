const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const productsService = require('./products.service');

const listProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await productsService.listProducts(req.query, req.user);
  success(res, { message: 'Product list', data: items, meta });
});

const getProduct = asyncHandler(async (req, res) => {
  const data = await productsService.getProductById(req.params.id, req.user);
  success(res, { message: 'Product detail', data });
});

const createProduct = asyncHandler(async (req, res) => {
  const data = await productsService.createProduct(req.body, req.user);
  success(res, { statusCode: 201, message: 'Product created', data });
});

const updateProduct = asyncHandler(async (req, res) => {
  const data = await productsService.updateProduct(req.params.id, req.body, req.user);
  success(res, { message: 'Product updated', data });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productsService.deleteProduct(req.params.id, req.user);
  success(res, { message: 'Product deleted' });
});

const adjustStock = asyncHandler(async (req, res) => {
  const data = await productsService.adjustStock(req.params.id, req.body, req.user);
  success(res, { message: `Stock updated to ${data.stock}`, data });
});

const listStockMovements = asyncHandler(async (req, res) => {
  const { items, meta } = await productsService.listStockMovements(req.query, req.params.id);
  success(res, { message: 'Stock movements', data: items, meta });
});

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, adjustStock, listStockMovements };
