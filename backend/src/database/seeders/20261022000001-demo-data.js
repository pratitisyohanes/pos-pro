const slugify = require('../../utils/slugify');
const { addDays, todayWib } = require('../../utils/time');
const { sequelize, ProductCategory, Product, Transaction, TransactionItem, StockMovement } = require('../../models');

// Same fixed ids as the fin-pro booking seeder, so demo receipts belong to real demo accounts
const USERS = {
  admin: { id: '0a000000-0000-4000-8000-000000000001', name: 'Admin Booking' },
  budi: { id: '0a000000-0000-4000-8000-000000000002', name: 'Budi Santoso' },
  siti: { id: '0a000000-0000-4000-8000-000000000003', name: 'Siti Rahma' },
};

// Service ids from the fin-pro seeder: 8 = cage installation (up to 50 birds), 5 = nipple drinker setup
const INSTALL_CAGE = 8;
const INSTALL_DRINKER = 5;

const categories = ['Cages', 'Equipment', 'Feed', 'Health'];

const products = [
  { category: 'Cages', sku: 'CG-BAT-1D', name: 'Battery Cage 1 Door (4 birds)', unit: 'UNIT', price: 85000, stock: 60, minStock: 10, installServiceId: INSTALL_CAGE, description: 'Galvanised wire layer cage, 1 door, holds 4 hens, with egg tray.' },
  { category: 'Cages', sku: 'CG-BAT-2D', name: 'Battery Cage 2 Doors (8 birds)', unit: 'UNIT', price: 150000, stock: 40, minStock: 8, installServiceId: INSTALL_CAGE, description: 'Galvanised wire layer cage, 2 doors, holds 8 hens, with egg tray.' },
  { category: 'Cages', sku: 'CG-BAT-4D', name: 'Battery Cage 4 Doors (16 birds)', unit: 'UNIT', price: 275000, stock: 6, minStock: 5, installServiceId: INSTALL_CAGE, description: 'Galvanised wire layer cage, 4 doors, holds 16 hens, with egg tray.' },
  { category: 'Equipment', sku: 'EQ-FDR-1M', name: 'Gutter Feeder 1 m', unit: 'PCS', price: 18000, stock: 120, minStock: 20, description: 'Galvanised feed gutter that hangs in front of a cage row.' },
  { category: 'Equipment', sku: 'EQ-NIP-10', name: 'Nipple Drinker (pack of 10)', unit: 'SET', price: 45000, stock: 35, minStock: 10, installServiceId: INSTALL_DRINKER, description: 'Stainless nipple drinkers for 1/2 inch pipe.' },
  { category: 'Equipment', sku: 'EQ-REG-01', name: 'Water Pressure Regulator', unit: 'UNIT', price: 95000, stock: 4, minStock: 5, installServiceId: INSTALL_DRINKER, description: 'Keeps nipple drinker lines at low, steady pressure.' },
  { category: 'Equipment', sku: 'EQ-EGT-30', name: 'Egg Tray 30 Holes', unit: 'PCS', price: 3500, stock: 500, minStock: 100, description: 'Plastic egg tray for 30 eggs, reusable.' },
  { category: 'Feed', sku: 'FD-LAY-50', name: 'Layer Feed 50 kg', unit: 'SACK', price: 410000, stock: 25, minStock: 10, description: 'Complete feed for laying hens from 18 weeks.' },
  { category: 'Feed', sku: 'FD-CON-50', name: 'Layer Concentrate 50 kg', unit: 'SACK', price: 520000, stock: 12, minStock: 5, description: 'Concentrate to mix with ground corn and bran.' },
  { category: 'Feed', sku: 'FD-CRN-50', name: 'Ground Corn 50 kg', unit: 'SACK', price: 300000, stock: 3, minStock: 5, description: 'Ground yellow corn for home-mixed layer feed.' },
  { category: 'Health', sku: 'HL-VIT-250', name: 'Layer Vitamin 250 ml', unit: 'BOTTLE', price: 38000, stock: 40, minStock: 10, description: 'Vitamin and electrolyte mix for drinking water.' },
  { category: 'Health', sku: 'HL-VAC-NDIB', name: 'ND-IB Vaccine 100 doses', unit: 'BOTTLE', price: 65000, stock: 15, minStock: 5, description: 'Live vaccine against Newcastle Disease and Infectious Bronchitis.' },
  { category: 'Health', sku: 'HL-DSF-1L', name: 'Coop Disinfectant 1 L', unit: 'BOTTLE', price: 55000, stock: 20, minStock: 5, description: 'Disinfectant for cages, floors and equipment.' },
];

// [customer, cashier, dayOffset, status, channel, [[sku, quantity], ...], paymentMethod]
const sampleSales = [
  ['budi', 'admin', -6, 'PAID', 'CASHIER', [['CG-BAT-2D', 10], ['EQ-FDR-1M', 10]], 'TRANSFER'],
  [null, 'admin', -5, 'PAID', 'CASHIER', [['FD-LAY-50', 4], ['HL-VIT-250', 2]], 'CASH'],
  ['siti', 'admin', -4, 'PAID', 'CASHIER', [['CG-BAT-4D', 4], ['EQ-NIP-10', 3]], 'EWALLET'],
  [null, 'admin', -3, 'PAID', 'CASHIER', [['EQ-EGT-30', 50], ['FD-LAY-50', 2]], 'CASH'],
  ['budi', 'admin', -2, 'PAID', 'SELF_ORDER', [['HL-VAC-NDIB', 2], ['HL-DSF-1L', 1]], 'CASH'],
  ['siti', null, -1, 'CANCELLED', 'SELF_ORDER', [['FD-CON-50', 1]], null],
  ['budi', null, 0, 'PENDING', 'SELF_ORDER', [['FD-LAY-50', 2], ['EQ-EGT-30', 20]], null],
];

const TABLES = 'stock_movements, transaction_items, transactions, products, product_categories';

const resetTables = () => sequelize.query(`TRUNCATE ${TABLES} RESTART IDENTITY CASCADE`);

const seedCatalog = async (admin) => {
  const createdCategories = await ProductCategory.bulkCreate(categories.map((name) => ({ name, slug: slugify(name) })));
  const categoryByName = Object.fromEntries(createdCategories.map((category) => [category.name, category]));
  const openedAt = new Date(`${addDays(todayWib(), -14)}T08:00:00+07:00`);

  const bySku = {};
  for (const { category, stock, ...data } of products) {
    const product = await Product.create({ ...data, imageUrl: `/products/${data.sku.toLowerCase()}.svg`, categoryId: categoryByName[category].id, stock });
    await StockMovement.create({ productId: product.id, type: 'RESTOCK', quantity: stock, stockAfter: stock, actorId: admin.id, actorName: admin.name, note: 'Opening stock' });
    bySku[product.sku] = product;
  }
  await sequelize.query("UPDATE stock_movements SET created_at = :openedAt WHERE note = 'Opening stock'", { replacements: { openedAt } });
  return bySku;
};

// Sequelize always stamps created_at with now, so demo history is backdated with plain SQL
const backdate = (saleId, createdAt) =>
  Promise.all(
    ['UPDATE transactions SET created_at = :createdAt WHERE id = :saleId', 'UPDATE transaction_items SET created_at = :createdAt WHERE transaction_id = :saleId', 'UPDATE stock_movements SET created_at = :createdAt WHERE transaction_id = :saleId'].map(
      (sql) => sequelize.query(sql, { replacements: { createdAt, saleId } }),
    ),
  );

const seedSales = async (bySku) => {
  for (const [index, [customerKey, cashierKey, dayOffset, status, channel, lines, method]] of sampleSales.entries()) {
    const customer = customerKey ? USERS[customerKey] : null;
    const cashier = cashierKey ? USERS[cashierKey] : null;
    const createdAt = new Date(`${addDays(todayWib(), dayOffset)}T${String(9 + index).padStart(2, '0')}:15:00+07:00`);
    const total = lines.reduce((sum, [sku, quantity]) => sum + Number(bySku[sku].price) * quantity, 0);

    const sale = await Transaction.create({
      invoiceNo: `INV-SEED-${String(index + 1).padStart(4, '0')}`,
      channel,
      status,
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? 'Walk-in customer',
      cashierId: cashier?.id ?? null,
      cashierName: cashier?.name ?? null,
      total,
      paymentMethod: method,
      paidAmount: status === 'PAID' ? total : null,
      changeAmount: status === 'PAID' ? 0 : null,
      paidAt: status === 'PAID' ? createdAt : null,
      note: status === 'CANCELLED' ? 'Cancelled by customer' : null,
    });

    for (const [sku, quantity] of lines) {
      const product = bySku[sku];
      await TransactionItem.create({ transactionId: sale.id, itemType: 'PRODUCT', productId: product.id, name: product.name, unit: product.unit, unitPrice: product.price, quantity, lineTotal: Number(product.price) * quantity });
      // Cancelled orders gave their stock back, so only paid and pending orders reduce it
      if (status === 'CANCELLED') continue;
      await product.update({ stock: product.stock - quantity });
      await StockMovement.create({ productId: product.id, type: 'SALE', quantity: -quantity, stockAfter: product.stock, transactionId: sale.id, actorId: (cashier || customer)?.id, actorName: (cashier || customer)?.name, note: sale.invoiceNo });
    }
    await backdate(sale.id, createdAt);
  }
};

module.exports = {
  async up() {
    if (process.env.NODE_ENV === 'production') throw new Error('Seeding is disabled in production');

    await resetTables();
    const bySku = await seedCatalog(USERS.admin);
    await seedSales(bySku);
    await sequelize.close();

    console.log('Log in with the fin-pro accounts (booking-api must be running):');
    console.log('Admin    : admin@booking.com / Admin12345');
    console.log('Customer : budi@example.com / User12345');
  },

  async down() {
    await resetTables();
    await sequelize.close();
  },
};
