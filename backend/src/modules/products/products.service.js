const { Op } = require('sequelize');
const { sequelize, Product, ProductCategory, StockMovement } = require('../../models');
const ApiError = require('../../utils/ApiError');
const compact = require('../../utils/compact');
const { getPagination, buildMeta, getSort } = require('../../utils/pagination');
const { resolveDateRange, toTimestampFilter } = require('../../utils/dateRange');

const categoryInclude = { model: ProductCategory, as: 'category', attributes: ['id', 'name', 'slug'] };

const isAdmin = (user) => user?.role === 'ADMIN';

const LOW_STOCK = sequelize.literal('"Product"."stock" <= "Product"."min_stock"');

// Guests and customers only see active products; soft-deleted rows are hidden by paranoid mode
const listProducts = async (query, user) => {
  const pagination = getPagination(query);
  const where = compact({
    categoryId: query.categoryId,
    status: isAdmin(user) ? query.status : 'ACTIVE',
  });

  if (query.search) {
    const pattern = { [Op.iLike]: `%${query.search}%` };
    where[Op.or] = [{ name: pattern }, { sku: pattern }, { description: pattern }, { '$category.name$': pattern }];
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) where.price[Op.gte] = query.minPrice;
    if (query.maxPrice !== undefined) where.price[Op.lte] = query.maxPrice;
  }
  if (query.lowStock) where[Op.and] = [LOW_STOCK];

  const { rows, count } = await Product.findAndCountAll({
    where,
    include: [categoryInclude],
    offset: pagination.offset,
    limit: pagination.limit,
    order: getSort(query.sort, ['name', 'price', 'stock', 'createdAt'], [['name', 'ASC']]),
  });

  return { items: rows, meta: buildMeta(pagination, count) };
};

const getProductById = async (id, user, transaction) => {
  const product = await Product.findOne({
    where: compact({ id, status: isAdmin(user) ? undefined : 'ACTIVE' }),
    include: [categoryInclude],
    transaction,
  });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

const ensureCategoryExists = async (categoryId) => {
  if (categoryId === undefined) return;
  const category = await ProductCategory.findByPk(categoryId);
  if (!category) throw ApiError.notFound('Category not found');
};

// Every stock change goes through here so stock_movements always matches products.stock
const applyStockChange = async (product, change, type, { actor, transactionId, note }, transaction) => {
  const stockAfter = product.stock + change;
  if (stockAfter < 0) throw ApiError.badRequest(`Stock of ${product.name} cannot go below 0 (now ${product.stock})`);

  await product.update({ stock: stockAfter }, { transaction });
  await StockMovement.create(
    { productId: product.id, type, quantity: change, stockAfter, transactionId, actorId: actor?.id, actorName: actor?.name, note },
    { transaction },
  );
  return product;
};

const createProduct = async ({ stock, ...data }, actor) => {
  await ensureCategoryExists(data.categoryId);
  const id = await sequelize.transaction(async (transaction) => {
    const product = await Product.create({ ...data, imageUrl: data.imageUrl || null, stock: 0 }, { transaction });
    if (stock > 0) await applyStockChange(product, stock, 'RESTOCK', { actor, note: 'Opening stock' }, transaction);
    return product.id;
  });
  return getProductById(id, actor);
};

const updateProduct = async (id, data, actor) => {
  const product = await getProductById(id, actor);
  await ensureCategoryExists(data.categoryId);
  await product.update({ ...data, ...(data.imageUrl === '' && { imageUrl: null }) });
  return getProductById(id, actor);
};

// Soft delete keeps old receipts readable; the product disappears from the catalog
const deleteProduct = async (id, actor) => {
  const product = await getProductById(id, actor);
  await sequelize.transaction(async (transaction) => {
    await product.update({ status: 'INACTIVE' }, { transaction });
    await product.destroy({ transaction });
  });
};

// Restock adds units; adjust corrects the count after a stock take (can be negative)
const adjustStock = (id, { type, quantity, note }, actor) =>
  sequelize.transaction(async (transaction) => {
    const product = await Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!product) throw ApiError.notFound('Product not found');
    await applyStockChange(product, quantity, type, { actor, note }, transaction);
    return getProductById(id, actor, transaction);
  });

const listStockMovements = async (query, productId) => {
  const pagination = getPagination(query);
  const range = resolveDateRange(query);
  const where = compact({ productId: productId || query.productId, type: query.type, createdAt: toTimestampFilter(range) });

  const { rows, count } = await StockMovement.findAndCountAll({
    where,
    include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'name', 'unit'], paranoid: false }],
    offset: pagination.offset,
    limit: pagination.limit,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });

  return { items: rows, meta: buildMeta(pagination, count) };
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  applyStockChange,
  listStockMovements,
};
