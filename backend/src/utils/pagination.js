const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Convert page/limit query values into Sequelize offset/limit
const getPagination = ({ page, limit } = {}) => {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
};

const buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

// Build a Sequelize order from "field:direction", restricted to a whitelist
const getSort = (sort, allowedFields, fallback = [['createdAt', 'DESC']]) => {
  if (!sort) return fallback;
  const [field, direction = 'asc'] = String(sort).split(':');
  if (!allowedFields.includes(field)) return fallback;
  return [[field, direction.toLowerCase() === 'desc' ? 'DESC' : 'ASC']];
};

module.exports = { getPagination, buildMeta, getSort, DEFAULT_LIMIT, MAX_LIMIT };
