const generateInvoiceNo = require('../../src/utils/invoiceNo');

describe('invoice number', () => {
  test('uses the INV-YYYYMMDD-XXXXXX format and is unique', () => {
    const first = generateInvoiceNo();
    expect(first).toMatch(/^INV-\d{8}-[0-9A-F]{6}$/);
    expect(generateInvoiceNo()).not.toBe(first);
  });
});
