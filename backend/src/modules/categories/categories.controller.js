const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const categoriesService = require('./categories.service');

const listCategories = asyncHandler(async (req, res) => {
  const { items, meta } = await categoriesService.listCategories(req.query);
  success(res, { message: 'Category list', data: items, meta });
});

const getCategory = asyncHandler(async (req, res) => {
  const data = await categoriesService.getCategoryById(req.params.id);
  success(res, { message: 'Category detail', data });
});

const createCategory = asyncHandler(async (req, res) => {
  const data = await categoriesService.createCategory(req.body);
  success(res, { statusCode: 201, message: 'Category created', data });
});

const updateCategory = asyncHandler(async (req, res) => {
  const data = await categoriesService.updateCategory(req.params.id, req.body);
  success(res, { message: 'Category updated', data });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoriesService.deleteCategory(req.params.id);
  success(res, { message: 'Category deleted' });
});

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
