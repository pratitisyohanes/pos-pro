const { Op } = require('sequelize');
const { sequelize, Transaction, TransactionItem, Product } = require('../../models');
const ApiError = require('../../utils/ApiError');
const compact = require('../../utils/compact');
const generateInvoiceNo = require('../../utils/invoiceNo');
const { getPagination, buildMeta, getSort } = require('../../utils/pagination');
const { resolveDateRange, toTimestampFilter } = require('../../utils/dateRange');
const bookingClient = require('../../clients/bookingClient');
const { applyStockChange } = require('../products/products.service');
const { canTransition, roundMoney, mergeItems, calculatePayment } = require('./transactions.rules');

const detailInclude = [
  {
    model: TransactionItem,
    as: 'items',
    include: [{ model: Product, as: 'product', attributes: ['id', 'sku', 'installServiceId'], paranoid: false }],
  },
];

const findDetail = (id, transaction) =>
  Transaction.findByPk(id, {
    include: detailInclude,
    order: [[{ model: TransactionItem, as: 'items' }, 'id', 'ASC']],
    transaction,
  });

// Lock products in id order so two checkouts never wait on each other in a cycle
const lockProducts = (productIds, transaction) =>
  Product.findAll({ where: { id: productIds }, order: [['id', 'ASC']], lock: transaction.LOCK.UPDATE, transaction });

const reserveLines = async (items, transaction) => {
  const wanted = mergeItems(items);
  const products = await lockProducts(
    wanted.map((item) => item.productId),
    transaction,
  );
  const byId = new Map(products.map((product) => [product.id, product]));

  return wanted.map(({ productId, quantity }) => {
    const product = byId.get(productId);
    if (!product || product.status !== 'ACTIVE') throw ApiError.badRequest(`Product #${productId} is not available`);
    if (product.stock < quantity) {
      throw ApiError.badRequest(`Not enough stock for ${product.name}: ${product.stock} ${product.unit.toLowerCase()} left`);
    }
    return { product, quantity, lineTotal: roundMoney(Number(product.price) * quantity) };
  });
};

// Save receipt lines and take the sold units out of stock
const saveLines = async (sale, lines, booking, actor, transaction) => {
  const rows = lines.map(({ product, quantity, lineTotal }) => ({
    transactionId: sale.id,
    itemType: 'PRODUCT',
    productId: product.id,
    name: product.name,
    unit: product.unit,
    unitPrice: product.price,
    quantity,
    lineTotal,
  }));
  if (booking) {
    rows.push({
      transactionId: sale.id,
      itemType: 'BOOKING',
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      name: `${booking.service.name} (${booking.bookingCode})`,
      unit: 'JOB',
      unitPrice: booking.totalPrice,
      quantity: 1,
      lineTotal: booking.totalPrice,
    });
  }
  await TransactionItem.bulkCreate(rows, { transaction });

  for (const { product, quantity } of lines) {
    await applyStockChange(product, -quantity, 'SALE', { actor, transactionId: sale.id, note: sale.invoiceNo }, transaction);
  }
};

const sumLines = (lines) => roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));

const ensureSettleable = (booking) => {
  if (booking.canSettle) return;
  if (booking.payment.status === 'PAID') throw ApiError.conflict(`Booking ${booking.bookingCode} is already paid`);
  throw ApiError.conflict(`Booking ${booking.bookingCode} must be confirmed before payment (current: ${booking.status})`);
};

const lookupBooking = (code) => bookingClient.getBooking(code);

// Cashier sale is paid immediately; an optional booking is settled in booking-api before commit
const createCashierSale = async ({ items, bookingCode, customerName, paymentMethod, paidAmount, note }, cashier) => {
  const booking = bookingCode ? await bookingClient.getBooking(bookingCode) : null;
  if (booking) ensureSettleable(booking);

  const saleId = await sequelize.transaction(async (transaction) => {
    const lines = items.length ? await reserveLines(items, transaction) : [];
    const total = roundMoney(sumLines(lines) + (booking?.totalPrice || 0));
    const payment = calculatePayment(total, paymentMethod, paidAmount);
    if (!payment) throw ApiError.badRequest(`Cash received must be at least ${total}`);

    const sale = await Transaction.create(
      {
        invoiceNo: generateInvoiceNo(),
        channel: 'CASHIER',
        status: 'PAID',
        customerId: booking?.customer.id ?? null,
        customerName: customerName || booking?.customer.name || 'Walk-in customer',
        cashierId: cashier.id,
        cashierName: cashier.name,
        total,
        paymentMethod,
        ...payment,
        paidAt: new Date(),
        note,
      },
      { transaction },
    );
    await saveLines(sale, lines, booking, cashier, transaction);

    // Last step: any earlier error rolls back without touching booking-api
    if (booking) {
      await bookingClient.settleBooking(booking.bookingCode, { method: paymentMethod, amount: booking.totalPrice, externalRef: sale.invoiceNo });
    }
    return sale.id;
  });

  return findDetail(saleId);
};

// Self-order reserves stock right away; the customer pays at the counter
const createSelfOrder = async ({ items, note }, customer) => {
  const orderId = await sequelize.transaction(async (transaction) => {
    const lines = await reserveLines(items, transaction);
    const order = await Transaction.create(
      {
        invoiceNo: generateInvoiceNo(),
        channel: 'SELF_ORDER',
        status: 'PENDING',
        customerId: customer.id,
        customerName: customer.name || 'Customer',
        total: sumLines(lines),
        note,
      },
      { transaction },
    );
    await saveLines(order, lines, null, customer, transaction);
    return order.id;
  });

  return findDetail(orderId);
};

const findForUpdate = async (id, transaction) => {
  const record = await Transaction.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!record) throw ApiError.notFound('Transaction not found');
  return record;
};

const payTransaction = async (id, { paymentMethod, paidAmount }, cashier) => {
  await sequelize.transaction(async (transaction) => {
    const record = await findForUpdate(id, transaction);
    if (!canTransition(record.status, 'PAID')) throw ApiError.badRequest(`A ${record.status} transaction cannot be paid`);

    const payment = calculatePayment(Number(record.total), paymentMethod, paidAmount);
    if (!payment) throw ApiError.badRequest(`Cash received must be at least ${Number(record.total)}`);

    await record.update(
      { status: 'PAID', paymentMethod, ...payment, paidAt: new Date(), cashierId: cashier.id, cashierName: cashier.name },
      { transaction },
    );
  });
  return findDetail(id);
};

// Only pending orders can be cancelled; reserved stock goes back to the shelf
const cancelTransaction = async (id, actor, reason) => {
  await sequelize.transaction(async (transaction) => {
    const record = await findForUpdate(id, transaction);
    if (actor.role !== 'ADMIN' && record.customerId !== actor.id) throw ApiError.forbidden('You can only cancel your own order');
    if (!canTransition(record.status, 'CANCELLED')) throw ApiError.badRequest('Only pending orders can be cancelled');

    const lines = await TransactionItem.findAll({ where: { transactionId: id, itemType: 'PRODUCT' }, transaction });
    const products = await lockProducts(
      lines.map((line) => line.productId),
      transaction,
    );
    const byId = new Map(products.map((product) => [product.id, product]));
    for (const line of lines) {
      await applyStockChange(byId.get(line.productId), line.quantity, 'CANCEL', { actor, transactionId: id, note: record.invoiceNo }, transaction);
    }

    const note = reason || (actor.role === 'ADMIN' ? 'Cancelled by admin' : 'Cancelled by customer');
    await record.update({ status: 'CANCELLED', note }, { transaction });
  });
  return findDetail(id);
};

const paginate = async (where, query) => {
  const pagination = getPagination(query);
  const createdAt = toTimestampFilter(resolveDateRange(query));
  // Assigned directly because compact() drops Symbol keys such as Op.or
  if (createdAt) where.createdAt = createdAt;
  const { rows, count } = await Transaction.findAndCountAll({
    where,
    offset: pagination.offset,
    limit: pagination.limit,
    order: getSort(query.sort, ['createdAt', 'total', 'status']),
  });
  return { items: rows, meta: buildMeta(pagination, count) };
};

const listMyTransactions = (customerId, query) => paginate(compact({ customerId, status: query.status }), query);

const listTransactions = (query) => {
  const where = compact({ status: query.status, channel: query.channel });
  if (query.search) {
    const pattern = { [Op.iLike]: `%${query.search}%` };
    where[Op.or] = [{ invoiceNo: pattern }, { customerName: pattern }];
  }
  return paginate(where, query);
};

const getTransactionById = async (id, actor) => {
  const record = await findDetail(id);
  if (!record) throw ApiError.notFound('Transaction not found');
  if (actor.role !== 'ADMIN' && record.customerId !== actor.id) throw ApiError.forbidden('You can only view your own orders');
  return record;
};

module.exports = {
  lookupBooking,
  createCashierSale,
  createSelfOrder,
  payTransaction,
  cancelTransaction,
  listMyTransactions,
  listTransactions,
  getTransactionById,
};
