// Transaction state machine: allowed next statuses for each status
const STATUS_TRANSITIONS = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

const canTransition = (from, to) => (STATUS_TRANSITIONS[from] || []).includes(to);

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

// Combine repeated lines for the same product, e.g. two scans of one SKU
const mergeItems = (items = []) => {
  const quantities = new Map();
  items.forEach(({ productId, quantity }) => quantities.set(productId, (quantities.get(productId) || 0) + quantity));
  return [...quantities.entries()].map(([productId, quantity]) => ({ productId, quantity }));
};

// Cash needs enough money handed over; transfer and e-wallet are always the exact total
const calculatePayment = (total, method, paidAmount) => {
  if (method !== 'CASH') return { paidAmount: roundMoney(total), changeAmount: 0 };
  const paid = roundMoney(paidAmount ?? total);
  if (paid < roundMoney(total)) return null;
  return { paidAmount: paid, changeAmount: roundMoney(paid - total) };
};

module.exports = { STATUS_TRANSITIONS, canTransition, roundMoney, mergeItems, calculatePayment };
