const { Op } = require('sequelize');
const { sequelize, ProductCategory, Product } = require('../../models');
const ApiError = require('../../utils/ApiError');
const slugify = require('../../utils/slugify');
const { getPagination, buildMeta, getSort } = require('../../utils/pagination');

// Number of non-deleted products per category
const productCount = [
  sequelize.literal(
    '(SELECT COUNT(*)::int FROM products p WHERE p.category_id = "ProductCategory"."id" AND p.deleted_at IS NULL)',
  ),
  'productCount',
];

const listCategories = async (query) => {
  const pagination = getPagination(query);
  const where = query.search ? { name: { [Op.iLike]: `%${query.search}%` } } : {};

  const { rows, count } = await ProductCategory.findAndCountAll({
    where,
    attributes: { include: [productCount] },
    offset: pagination.offset,
    limit: pagination.limit,
    order: getSort(query.sort, ['name', 'createdAt'], [['name', 'ASC']]),
  });

  return { items: rows, meta: buildMeta(pagination, count) };
};

const getCategoryById = async (id) => {
  const category = await ProductCategory.findByPk(id, { attributes: { include: [productCount] } });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
};

const createCategory = ({ name }) => ProductCategory.create({ name, slug: slugify(name) });

const updateCategory = async (id, { name }) => {
  const category = await getCategoryById(id);
  return category.update({ name, slug: slugify(name) });
};

// Categories still referenced by products (including soft-deleted ones) cannot be deleted
const deleteCategory = async (id) => {
  const category = await getCategoryById(id);
  const usedBy = await Product.count({ where: { categoryId: id }, paranoid: false });
  if (usedBy > 0) throw ApiError.conflict(`Category is still used by ${usedBy} product(s)`);
  await category.destroy();
};

module.exports = { listCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
