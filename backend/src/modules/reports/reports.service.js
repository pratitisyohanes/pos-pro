const { Op, QueryTypes } = require('sequelize');
const { sequelize, Transaction, TransactionItem, Product } = require('../../models');
const toCsv = require('../../utils/csv');
const bookingClient = require('../../clients/bookingClient');
const { resolveDateRange, toTimestampFilter } = require('../../utils/dateRange');
const { todayWib, toDateString, addDays } = require('../../utils/time');

// Reports default to the current month when no range is given
const getRange = (query) => {
  const range = resolveDateRange(query) || resolveDateRange({ period: 'this_month' });
  return { start: range.start || '1970-01-01', end: range.end || todayWib() };
};

// WIB day boundaries for raw SQL on timestamp columns
const toBounds = (range) => ({
  startAt: new Date(`${range.start}T00:00:00+07:00`),
  endAt: new Date(`${addDays(range.end, 1)}T00:00:00+07:00`),
});

const LOW_STOCK = sequelize.literal('"Product"."stock" <= "Product"."min_stock"');

const getSummary = async (query) => {
  const range = getRange(query);
  const paidInRange = { status: 'PAID', paidAt: toTimestampFilter(range) };

  const [salesCount, revenue, itemsSold, pendingOrders, lowStockCount] = await Promise.all([
    Transaction.count({ where: paidInRange }),
    Transaction.sum('total', { where: paidInRange }),
    TransactionItem.sum('quantity', {
      where: { itemType: 'PRODUCT' },
      include: [{ model: Transaction, as: 'transaction', attributes: [], where: paidInRange }],
    }),
    Transaction.count({ where: { status: 'PENDING' } }),
    Product.count({ where: { status: 'ACTIVE', [Op.and]: [LOW_STOCK] } }),
  ]);

  return {
    range,
    salesCount,
    totalRevenue: Number(revenue || 0),
    averageSale: salesCount ? Math.round(Number(revenue) / salesCount) : 0,
    itemsSold: Number(itemsSold || 0),
    pendingOrders,
    lowStockCount,
  };
};

// Raw SQL keeps the aggregation readable and still counts soft-deleted products
const getTopProducts = async (query) => {
  const range = getRange(query);
  const items = await sequelize.query(
    `SELECT p.id AS "productId", p.sku, p.name AS "productName", p.unit,
            SUM(ti.quantity)::int AS "quantitySold", SUM(ti.line_total)::float AS "revenue"
     FROM transaction_items ti
     JOIN transactions t ON t.id = ti.transaction_id
     JOIN products p ON p.id = ti.product_id
     WHERE ti.item_type = 'PRODUCT' AND t.status = 'PAID' AND t.paid_at >= :startAt AND t.paid_at < :endAt
     GROUP BY p.id, p.sku, p.name, p.unit
     ORDER BY "quantitySold" DESC, p.name
     LIMIT :limit`,
    { replacements: { ...toBounds(range), limit: query.limit }, type: QueryTypes.SELECT },
  );
  return { range, items };
};

const getLowStock = async ({ limit }) => {
  const items = await Product.findAll({
    where: { status: 'ACTIVE', [Op.and]: [LOW_STOCK] },
    attributes: ['id', 'sku', 'name', 'unit', 'stock', 'minStock'],
    order: [[sequelize.literal('"stock" - "min_stock"'), 'ASC'], ['name', 'ASC']],
    limit,
  });
  return { items };
};

// Revenue per day or month from paid sales, grouped in WIB
const getSales = async (query) => {
  const range = getRange(query);
  const sales = await Transaction.findAll({
    where: { status: 'PAID', paidAt: toTimestampFilter(range) },
    attributes: ['total', 'paidAt'],
    raw: true,
  });

  const keyLength = query.groupBy === 'month' ? 7 : 10;
  const buckets = new Map();
  sales.forEach(({ total, paidAt }) => {
    const key = toDateString(new Date(new Date(paidAt).getTime() + 7 * 60 * 60 * 1000)).slice(0, keyLength);
    const bucket = buckets.get(key) || { period: key, revenue: 0, transactions: 0 };
    bucket.revenue += Number(total);
    bucket.transactions += 1;
    buckets.set(key, bucket);
  });

  const items = [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));
  return { range, groupBy: query.groupBy, total: items.reduce((sum, item) => sum + item.revenue, 0), items };
};

const exportReport = async (query) => {
  const range = getRange(query);

  if (query.type === 'top-products') {
    const { items } = await getTopProducts({ ...query, limit: 50 });
    const csv = toCsv(items, [
      { header: 'SKU', value: (r) => r.sku },
      { header: 'Product', value: (r) => r.productName },
      { header: 'Unit', value: (r) => r.unit },
      { header: 'Quantity Sold', value: (r) => r.quantitySold },
      { header: 'Revenue', value: (r) => r.revenue },
    ]);
    return { filename: `top-products_${range.start}_${range.end}.csv`, csv };
  }

  const sales = await Transaction.findAll({
    where: { createdAt: toTimestampFilter(range) },
    order: [['createdAt', 'ASC']],
  });
  const csv = toCsv(sales, [
    { header: 'Invoice', value: (t) => t.invoiceNo },
    { header: 'Date', value: (t) => t.createdAt.toISOString() },
    { header: 'Channel', value: (t) => t.channel },
    { header: 'Status', value: (t) => t.status },
    { header: 'Customer', value: (t) => t.customerName },
    { header: 'Cashier', value: (t) => t.cashierName },
    { header: 'Total', value: (t) => Number(t.total) },
    { header: 'Payment Method', value: (t) => t.paymentMethod },
  ]);
  return { filename: `transactions_${range.start}_${range.end}.csv`, csv };
};

// Booking figures come from booking-api so the POS dashboard shows the whole business
const getBookingSummary = (query) => bookingClient.getSummary(getRange(query));

module.exports = { getSummary, getTopProducts, getLowStock, getSales, exportReport, getBookingSummary };
