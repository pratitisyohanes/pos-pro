// Labels and badge tones mirror the enums defined in the backend models
export const TRANSACTION_STATUS = {
  PENDING: { label: 'Awaiting payment', tone: 'amber' },
  PAID: { label: 'Paid', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
};

export const CHANNEL = {
  CASHIER: { label: 'Cashier', tone: 'blue' },
  SELF_ORDER: { label: 'Self-order', tone: 'gray' },
};

export const PRODUCT_STATUS = {
  ACTIVE: { label: 'Active', tone: 'green' },
  INACTIVE: { label: 'Inactive', tone: 'gray' },
};

export const MOVEMENT_TYPE = {
  SALE: { label: 'Sale', tone: 'red' },
  CANCEL: { label: 'Cancelled order', tone: 'blue' },
  RESTOCK: { label: 'Restock', tone: 'green' },
  ADJUST: { label: 'Adjustment', tone: 'amber' },
};

export const UNIT_LABEL = {
  UNIT: 'unit',
  PCS: 'pcs',
  SET: 'set',
  SACK: 'sack',
  BOTTLE: 'bottle',
  JOB: 'job',
};

export const UNIT_OPTIONS = Object.keys(UNIT_LABEL)
  .filter((unit) => unit !== 'JOB')
  .map((value) => ({ value, label: UNIT_LABEL[value] }));

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'TRANSFER', label: 'Bank transfer' },
  { value: 'EWALLET', label: 'E-wallet' },
];

export const PAYMENT_LABEL = Object.fromEntries(PAYMENT_METHODS.map(({ value, label }) => [value, label]));

export const PERIOD_OPTIONS = [
  { value: '', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
];

export const toOptions = (map) => Object.entries(map).map(([value, { label }]) => ({ value, label }));

export const isLowStock = (product) => product.stock <= product.minStock;
