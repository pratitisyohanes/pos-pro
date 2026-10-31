const crypto = require('crypto');
const { addDays, todayWib } = require('../../utils/time');

// Same fixed ids as the fin-pro booking seeder, so these receipts belong to real demo accounts
const ADMIN = { id: '0a000000-0000-4000-8000-000000000001', name: 'Admin Booking' };
const CUSTOMERS = [
  { id: '0a000000-0000-4000-8000-000000000002', name: 'Budi Santoso' },
  { id: '0a000000-0000-4000-8000-000000000003', name: 'Siti Rahma' },
];

const DAYS = 30;
// Positions in the 30-day run (0 = oldest) that were cancelled by the customer
const CANCELLED_DAYS = new Set([4, 11, 19, 26]);
// Largest quantity of one line, by unit
const MAX_QUANTITY = { UNIT: 3, SET: 3, SACK: 3, BOTTLE: 4, PCS: 12 };
const INVOICE_PATTERN = '^INV-[0-9]{8}-M[0-9]{4}$';

// Small seeded generator, so every run builds the same month of sales
const createRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = (random, list) => list[Math.floor(random() * list.length)];
const between = (random, min, max) => min + Math.floor(random() * (max - min + 1));

const choosePaymentMethod = (random) => {
  const roll = random();
  if (roll < 0.5) return 'CASH';
  return roll < 0.8 ? 'TRANSFER' : 'EWALLET';
};

// Cash customers hand over a round amount, so there is change to give back
const roundUpCash = (total) => {
  const step = total >= 500000 ? 100000 : total >= 100000 ? 50000 : 10000;
  return Math.ceil(total / step) * step;
};

module.exports = {
  // Also used by 20261101000002, which adds the same sales on the production server
  async insertSampleSales(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;
    const [{ count }] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM transactions WHERE invoice_no ~ '${INVOICE_PATTERN}'`, { type: Sequelize.QueryTypes.SELECT });
    if (count > 0) return;

    await sequelize.transaction(async (transaction) => {
      const products = await sequelize.query("SELECT id, name, unit, price, stock, min_stock FROM products WHERE status = 'ACTIVE' ORDER BY id", { type: Sequelize.QueryTypes.SELECT, transaction });
      if (!products.length) return;
      // Sales never push a product below its minimum stock, so low-stock alerts stay as they were
      const stockById = Object.fromEntries(products.map((product) => [product.id, product.stock]));

      const random = createRandom(20261031);
      const today = todayWib();
      const transactions = [];
      const items = [];
      const movements = [];

      for (let day = 0; day < DAYS; day++) {
        const date = addDays(today, day - (DAYS - 1));
        const isToday = day === DAYS - 1;
        // Today's sale is early in the morning so it is never in the future
        const hour = isToday ? between(random, 8, 9) : between(random, 8, 20);
        const createdAt = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(between(random, 0, 59)).padStart(2, '0')}:00+07:00`);

        const cancelled = CANCELLED_DAYS.has(day);
        const channel = random() < 0.4 ? 'SELF_ORDER' : 'CASHIER';
        const customer = channel === 'SELF_ORDER' || random() < 0.4 ? pick(random, CUSTOMERS) : null;
        const cashier = cancelled ? null : ADMIN;

        const lines = [];
        const wanted = new Set();
        const lineCount = between(random, 1, 3);
        for (let attempt = 0; attempt < lineCount * 6 && lines.length < lineCount; attempt++) {
          const product = pick(random, products);
          if (wanted.has(product.id)) continue;
          const available = stockById[product.id] - product.min_stock;
          if (available < 1) continue;
          const quantity = Math.min(between(random, 1, MAX_QUANTITY[product.unit] || 3), available);
          wanted.add(product.id);
          lines.push({ product, quantity });
        }
        if (!lines.length) continue;

        const total = lines.reduce((sum, { product, quantity }) => sum + Number(product.price) * quantity, 0);
        const paymentMethod = cancelled ? null : choosePaymentMethod(random);
        const paidAmount = cancelled ? null : paymentMethod === 'CASH' ? roundUpCash(total) : total;
        const id = crypto.randomUUID();
        const invoiceNo = `INV-${date.replace(/-/g, '')}-M${String(day + 1).padStart(4, '0')}`;
        const actor = cashier || customer || ADMIN;

        transactions.push({
          id,
          invoice_no: invoiceNo,
          channel,
          status: cancelled ? 'CANCELLED' : 'PAID',
          customer_id: customer?.id ?? null,
          customer_name: customer?.name ?? 'Walk-in customer',
          cashier_id: cashier?.id ?? null,
          cashier_name: cashier?.name ?? null,
          total,
          payment_method: paymentMethod,
          paid_amount: paidAmount,
          change_amount: cancelled ? null : paidAmount - total,
          paid_at: cancelled ? null : createdAt,
          note: cancelled ? 'Cancelled by customer' : null,
          created_at: createdAt,
          updated_at: createdAt,
        });

        for (const { product, quantity } of lines) {
          items.push({
            transaction_id: id,
            item_type: 'PRODUCT',
            product_id: product.id,
            name: product.name,
            unit: product.unit,
            unit_price: product.price,
            quantity,
            line_total: Number(product.price) * quantity,
            created_at: createdAt,
          });
          // Cancelled orders gave their stock back, so only paid sales reduce it
          if (cancelled) continue;
          stockById[product.id] -= quantity;
          movements.push({
            product_id: product.id,
            type: 'SALE',
            quantity: -quantity,
            stock_after: stockById[product.id],
            transaction_id: id,
            actor_id: actor.id,
            actor_name: actor.name,
            note: invoiceNo,
            created_at: createdAt,
          });
        }
      }

      await queryInterface.bulkInsert('transactions', transactions, { transaction });
      await queryInterface.bulkInsert('transaction_items', items, { transaction });
      if (movements.length) await queryInterface.bulkInsert('stock_movements', movements, { transaction });
      for (const product of products) {
        if (stockById[product.id] !== product.stock) {
          await sequelize.query('UPDATE products SET stock = :stock, updated_at = NOW() WHERE id = :id', { replacements: { stock: stockById[product.id], id: product.id }, transaction });
        }
      }
    });
  },

  async up(queryInterface, Sequelize) {
    // Skipped (but still recorded as run) on the production server
    if (process.env.NODE_ENV === 'production') return;
    await module.exports.insertSampleSales(queryInterface, Sequelize);
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    await sequelize.transaction(async (transaction) => {
      const ids = `SELECT id FROM transactions WHERE invoice_no ~ '${INVOICE_PATTERN}'`;
      // Sale movements are negative, so subtracting their sum puts the stock back
      await sequelize.query(
        `UPDATE products p SET stock = p.stock - sold.quantity, updated_at = NOW()
         FROM (SELECT product_id, SUM(quantity) AS quantity FROM stock_movements WHERE type = 'SALE' AND transaction_id IN (${ids}) GROUP BY product_id) sold
         WHERE p.id = sold.product_id`,
        { transaction },
      );
      await sequelize.query(`DELETE FROM stock_movements WHERE transaction_id IN (${ids})`, { transaction });
      await sequelize.query(`DELETE FROM transaction_items WHERE transaction_id IN (${ids})`, { transaction });
      await sequelize.query(`DELETE FROM transactions WHERE invoice_no ~ '${INVOICE_PATTERN}'`, { transaction });
    });
  },
};
