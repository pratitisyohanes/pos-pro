const crypto = require('crypto');
const { todayWib } = require('./time');

// Readable unique invoice number, e.g. INV-20261022-7F3A9C
const generateInvoiceNo = () => {
  const datePart = todayWib().replace(/-/g, '');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `INV-${datePart}-${randomPart}`;
};

module.exports = generateInvoiceNo;
