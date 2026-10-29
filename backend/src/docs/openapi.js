const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

const ok = (description, data, meta) => ({
  description,
  content: {
    'application/json': {
      schema: ref('SuccessResponse'),
      example: { success: true, message: description, data, ...(meta && { meta }) },
    },
  },
});

const errors = (...codes) => Object.fromEntries(codes.map((code) => [code, { $ref: `#/components/responses/E${code}` }]));

const jsonBody = (schemaName, example) => ({
  required: true,
  content: { 'application/json': { schema: ref(schemaName), example } },
});

const query = (name, schema, description) => ({ name, in: 'query', required: false, schema, description });

const pathParam = (name, type = 'integer') => ({
  name,
  in: 'path',
  required: true,
  schema: type === 'uuid' ? { type: 'string', format: 'uuid' } : type === 'string' ? { type: 'string' } : { type: 'integer' },
});

const paging = [
  query('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number'),
  query('limit', { type: 'integer', minimum: 1, maximum: 100, default: 10 }, 'Items per page'),
  query('sort', { type: 'string', example: 'createdAt:desc' }, 'field:asc or field:desc'),
];

const range = [
  query('from', { type: 'string', format: 'date' }, 'Start date YYYY-MM-DD'),
  query('to', { type: 'string', format: 'date' }, 'End date YYYY-MM-DD'),
  query('period', { type: 'string', enum: ['today', 'this_week', 'this_month'] }, 'Shortcut range, overrides from/to'),
];

const secured = [{ bearerAuth: [] }];
const meta = { page: 1, limit: 10, total: 1, totalPages: 1 };

const sampleProduct = { id: 2, categoryId: 1, sku: 'CG-BAT-2D', name: 'Battery Cage 2 Doors (8 birds)', unit: 'UNIT', price: '150000.00', stock: 30, minStock: 8, installServiceId: 2, status: 'ACTIVE', category: { id: 1, name: 'Cages', slug: 'cages' } };
const sampleSale = {
  id: '5b1e0c7a-3333-4c1d-8e9f-abcdef123456',
  invoiceNo: 'INV-20261022-7F3A9C',
  channel: 'CASHIER',
  status: 'PAID',
  customerName: 'Budi Santoso',
  cashierName: 'Admin Booking',
  total: '1650000.00',
  paymentMethod: 'CASH',
  paidAmount: '1700000.00',
  changeAmount: '50000.00',
  items: [
    { itemType: 'PRODUCT', productId: 2, name: 'Battery Cage 2 Doors (8 birds)', unit: 'UNIT', unitPrice: '150000.00', quantity: 1, lineTotal: '150000.00' },
    { itemType: 'BOOKING', bookingCode: 'BK-SEED-0009', name: 'Battery Cage Installation (500 birds) (BK-SEED-0009)', unit: 'JOB', unitPrice: '1500000.00', quantity: 1, lineTotal: '1500000.00' },
  ],
};

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Layer Farm POS API',
    version: '1.0.0',
    description:
      'Point of Sales for layer farm cages, equipment, feed and health products. Accounts and JWTs come from booking-api (fin-pro): ' +
      'log in there, then send the access token here. Roles: ADMIN works the cashier and manages products; USER places self-orders. ' +
      'Relations: ProductCategory 1-N Product 1-N StockMovement; Transaction 1-N TransactionItem N-1 Product; a BOOKING item points to a booking in booking-api.',
  },
  servers: [{ url: '/api/v1', description: 'Current host' }],
  tags: ['Categories', 'Products', 'Stock', 'Bookings', 'Transactions', 'Reports'].map((name) => ({ name })),
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Access token from booking-api POST /api/v1/auth/login' } },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: {}, meta: ref('Meta') },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
        },
      },
      Meta: {
        type: 'object',
        properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' }, totalPages: { type: 'integer' } },
      },
      CategoryInput: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
      ProductInput: {
        type: 'object',
        required: ['categoryId', 'sku', 'name', 'unit', 'price', 'minStock'],
        properties: {
          categoryId: { type: 'integer' },
          sku: { type: 'string', example: 'CG-BAT-2D' },
          name: { type: 'string' },
          description: { type: 'string' },
          unit: { type: 'string', enum: ['UNIT', 'PCS', 'SET', 'SACK', 'BOTTLE'] },
          price: { type: 'number' },
          stock: { type: 'integer', description: 'Opening stock, create only' },
          minStock: { type: 'integer' },
          installServiceId: { type: 'integer', nullable: true, description: 'Service id in booking-api' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          imageUrl: { type: 'string', format: 'uri' },
        },
      },
      StockInput: {
        type: 'object',
        required: ['type', 'quantity'],
        properties: { type: { type: 'string', enum: ['RESTOCK', 'ADJUST'] }, quantity: { type: 'integer', description: 'RESTOCK > 0, ADJUST may be negative' }, note: { type: 'string' } },
      },
      LineItem: { type: 'object', required: ['productId', 'quantity'], properties: { productId: { type: 'integer' }, quantity: { type: 'integer', minimum: 1 } } },
      CashierSaleInput: {
        type: 'object',
        required: ['paymentMethod'],
        properties: {
          items: { type: 'array', items: ref('LineItem') },
          bookingCode: { type: 'string', example: 'BK-SEED-0009', description: 'Confirmed, unpaid booking to settle on the same receipt' },
          customerName: { type: 'string' },
          paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'EWALLET'] },
          paidAmount: { type: 'number', description: 'Cash handed over; ignored for transfer and e-wallet' },
          note: { type: 'string' },
        },
      },
      SelfOrderInput: { type: 'object', required: ['items'], properties: { items: { type: 'array', items: ref('LineItem') }, note: { type: 'string' } } },
      PayInput: { type: 'object', required: ['paymentMethod'], properties: { paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER', 'EWALLET'] }, paidAmount: { type: 'number' } } },
      CancelInput: { type: 'object', properties: { reason: { type: 'string' } } },
    },
    responses: Object.fromEntries(
      [
        [400, 'Business rule violated'],
        [401, 'Missing or invalid access token'],
        [403, 'Role not allowed'],
        [404, 'Not found'],
        [409, 'Conflict with existing data or booking-api'],
        [422, 'Validation failed'],
        [502, 'booking-api not reachable'],
      ].map(([code, description]) => [`E${code}`, { description, content: { 'application/json': { schema: ref('ErrorResponse') } } }]),
    ),
  },
  paths: {
    '/categories': {
      get: { tags: ['Categories'], summary: 'List product categories', parameters: [...paging, query('search', { type: 'string' })], responses: { 200: ok('Category list', [{ id: 1, name: 'Cages', slug: 'cages', productCount: 3 }], meta) } },
      post: { tags: ['Categories'], summary: 'Create a category (admin)', security: secured, requestBody: jsonBody('CategoryInput', { name: 'Cages' }), responses: { 201: ok('Category created', { id: 1, name: 'Cages', slug: 'cages' }), ...errors(401, 403, 409, 422) } },
    },
    '/categories/{id}': {
      get: { tags: ['Categories'], summary: 'Category detail', parameters: [pathParam('id')], responses: { 200: ok('Category detail', { id: 1, name: 'Cages' }), ...errors(404) } },
      patch: { tags: ['Categories'], summary: 'Rename a category (admin)', security: secured, parameters: [pathParam('id')], requestBody: jsonBody('CategoryInput', { name: 'Layer Cages' }), responses: { 200: ok('Category updated', { id: 1, name: 'Layer Cages' }), ...errors(401, 403, 404, 409) } },
      delete: { tags: ['Categories'], summary: 'Delete an unused category (admin)', security: secured, parameters: [pathParam('id')], responses: { 200: ok('Category deleted', null), ...errors(401, 403, 404, 409) } },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'Catalog with search, filters and pagination (admins also see inactive products)',
        parameters: [
          ...paging,
          query('search', { type: 'string' }, 'Name, SKU, description or category'),
          query('categoryId', { type: 'integer' }),
          query('status', { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }, 'Admin only'),
          query('lowStock', { type: 'boolean' }, 'Only products at or below minimum stock'),
          query('minPrice', { type: 'number' }),
          query('maxPrice', { type: 'number' }),
        ],
        responses: { 200: ok('Product list', [sampleProduct], meta), ...errors(422) },
      },
      post: { tags: ['Products'], summary: 'Create a product (admin)', security: secured, requestBody: jsonBody('ProductInput', { categoryId: 1, sku: 'CG-BAT-2D', name: 'Battery Cage 2 Doors (8 birds)', unit: 'UNIT', price: 150000, stock: 40, minStock: 8, installServiceId: 2 }), responses: { 201: ok('Product created', sampleProduct), ...errors(401, 403, 404, 409, 422) } },
    },
    '/products/{id}': {
      get: { tags: ['Products'], summary: 'Product detail', parameters: [pathParam('id')], responses: { 200: ok('Product detail', sampleProduct), ...errors(404) } },
      patch: { tags: ['Products'], summary: 'Update a product (admin); stock changes go through /stock', security: secured, parameters: [pathParam('id')], requestBody: jsonBody('ProductInput', { price: 155000 }), responses: { 200: ok('Product updated', sampleProduct), ...errors(401, 403, 404, 422) } },
      delete: { tags: ['Products'], summary: 'Soft delete a product (admin)', security: secured, parameters: [pathParam('id')], responses: { 200: ok('Product deleted', null), ...errors(401, 403, 404) } },
    },
    '/products/{id}/stock': {
      post: { tags: ['Stock'], summary: 'Restock or adjust stock (admin)', security: secured, parameters: [pathParam('id')], requestBody: jsonBody('StockInput', { type: 'RESTOCK', quantity: 20, note: 'Supplier delivery' }), responses: { 200: ok('Stock updated to 50', sampleProduct), ...errors(400, 401, 403, 404, 422) } },
    },
    '/products/{id}/stock-movements': {
      get: { tags: ['Stock'], summary: 'Stock history of one product (admin)', security: secured, parameters: [pathParam('id'), ...paging, ...range], responses: { 200: ok('Stock movements', [{ id: 1, type: 'SALE', quantity: -2, stockAfter: 28, note: 'INV-20261022-7F3A9C' }], meta), ...errors(401, 403) } },
    },
    '/products/stock-movements': {
      get: { tags: ['Stock'], summary: 'Stock history of all products (admin)', security: secured, parameters: [...paging, ...range, query('productId', { type: 'integer' }), query('type', { type: 'string', enum: ['SALE', 'CANCEL', 'RESTOCK', 'ADJUST'] })], responses: { 200: ok('Stock movements', [], meta), ...errors(401, 403) } },
    },
    '/bookings/{code}': {
      get: { tags: ['Bookings'], summary: 'Look up a booking in booking-api for the cashier (admin)', security: secured, parameters: [pathParam('code', 'string')], responses: { 200: ok('Booking detail', { bookingCode: 'BK-SEED-0009', status: 'CONFIRMED', totalPrice: 1500000, service: { id: 2, name: 'Battery Cage Installation (500 birds)' }, customer: { name: 'Budi Santoso' }, payment: { status: 'UNPAID' }, canSettle: true }), ...errors(401, 403, 404, 502) } },
    },
    '/transactions': {
      get: { tags: ['Transactions'], summary: 'All transactions (admin)', security: secured, parameters: [...paging, ...range, query('status', { type: 'string', enum: ['PENDING', 'PAID', 'CANCELLED'] }), query('channel', { type: 'string', enum: ['CASHIER', 'SELF_ORDER'] }), query('search', { type: 'string' }, 'Invoice or customer name')], responses: { 200: ok('Transaction list', [sampleSale], meta), ...errors(401, 403) } },
      post: { tags: ['Transactions'], summary: 'Cashier checkout, optionally settling a booking (admin)', security: secured, requestBody: jsonBody('CashierSaleInput', { items: [{ productId: 2, quantity: 1 }], bookingCode: 'BK-SEED-0009', paymentMethod: 'CASH', paidAmount: 1700000 }), responses: { 201: ok('Sale completed', sampleSale), ...errors(400, 401, 403, 404, 409, 422, 502) } },
    },
    '/transactions/self-order': {
      post: { tags: ['Transactions'], summary: 'Customer self-order, paid later at the counter (user)', security: secured, requestBody: jsonBody('SelfOrderInput', { items: [{ productId: 8, quantity: 2 }] }), responses: { 201: ok('Order placed, please pay at the counter', { ...sampleSale, channel: 'SELF_ORDER', status: 'PENDING' }), ...errors(400, 401, 403, 422) } },
    },
    '/transactions/me': {
      get: { tags: ['Transactions'], summary: 'My orders (user)', security: secured, parameters: [...paging, ...range, query('status', { type: 'string', enum: ['PENDING', 'PAID', 'CANCELLED'] })], responses: { 200: ok('My orders', [sampleSale], meta), ...errors(401, 403) } },
    },
    '/transactions/{id}': {
      get: { tags: ['Transactions'], summary: 'Receipt detail (owner or admin)', security: secured, parameters: [pathParam('id', 'uuid')], responses: { 200: ok('Transaction detail', sampleSale), ...errors(401, 403, 404) } },
    },
    '/transactions/{id}/pay': {
      patch: { tags: ['Transactions'], summary: 'Record payment for a pending self-order (admin)', security: secured, parameters: [pathParam('id', 'uuid')], requestBody: jsonBody('PayInput', { paymentMethod: 'CASH', paidAmount: 900000 }), responses: { 200: ok('Payment recorded', sampleSale), ...errors(400, 401, 403, 404) } },
    },
    '/transactions/{id}/cancel': {
      patch: { tags: ['Transactions'], summary: 'Cancel a pending order and return its stock (owner or admin)', security: secured, parameters: [pathParam('id', 'uuid')], requestBody: jsonBody('CancelInput', { reason: 'Changed my mind' }), responses: { 200: ok('Order cancelled', { ...sampleSale, status: 'CANCELLED' }), ...errors(400, 401, 403, 404) } },
    },
    '/reports/summary': {
      get: { tags: ['Reports'], summary: 'Sales summary (admin)', security: secured, parameters: range, responses: { 200: ok('Sales summary', { salesCount: 5, totalRevenue: 4850000, averageSale: 970000, itemsSold: 85, pendingOrders: 1, lowStockCount: 2 }), ...errors(401, 403) } },
    },
    '/reports/top-products': {
      get: { tags: ['Reports'], summary: 'Best selling products (admin)', security: secured, parameters: [...range, query('limit', { type: 'integer', default: 5 })], responses: { 200: ok('Top products', { items: [{ productId: 7, sku: 'EQ-EGT-30', productName: 'Egg Tray 30 Holes', quantitySold: 50, revenue: 175000 }] }), ...errors(401, 403) } },
    },
    '/reports/low-stock': {
      get: { tags: ['Reports'], summary: 'Products at or below minimum stock (admin)', security: secured, parameters: [query('limit', { type: 'integer', default: 10 })], responses: { 200: ok('Low stock products', { items: [{ sku: 'FD-CRN-50', name: 'Ground Corn 50 kg', stock: 3, minStock: 5 }] }), ...errors(401, 403) } },
    },
    '/reports/sales': {
      get: { tags: ['Reports'], summary: 'Revenue per day or month (admin)', security: secured, parameters: [...range, query('groupBy', { type: 'string', enum: ['day', 'month'], default: 'day' })], responses: { 200: ok('Sales report', { groupBy: 'day', total: 1690000, items: [{ period: '2026-10-16', revenue: 1690000, transactions: 1 }] }), ...errors(401, 403) } },
    },
    '/reports/export': {
      get: { tags: ['Reports'], summary: 'Download a report as CSV (admin)', security: secured, parameters: [...range, query('type', { type: 'string', enum: ['transactions', 'top-products'], default: 'transactions' }), query('format', { type: 'string', enum: ['csv'], default: 'csv' })], responses: { 200: { description: 'CSV file', content: { 'text/csv': { schema: { type: 'string' } } } }, ...errors(401, 403) } },
    },
    '/reports/booking-summary': {
      get: { tags: ['Reports'], summary: 'Booking figures fetched from booking-api (admin)', security: secured, parameters: range, responses: { 200: ok('Booking summary from booking-api', { totalBookings: 13, totalRevenue: 5900000 }), ...errors(401, 403, 502) } },
    },
  },
};

module.exports = spec;
