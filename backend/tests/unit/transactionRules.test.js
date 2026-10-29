const { canTransition, mergeItems, calculatePayment, roundMoney } = require('../../src/modules/transactions/transactions.rules');

describe('transaction rules', () => {
  test('only pending orders can be paid or cancelled', () => {
    expect(canTransition('PENDING', 'PAID')).toBe(true);
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true);
    expect(canTransition('PAID', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'PAID')).toBe(false);
  });

  test('repeated products are merged into one line', () => {
    expect(mergeItems([{ productId: 1, quantity: 2 }, { productId: 3, quantity: 1 }, { productId: 1, quantity: 5 }])).toEqual([
      { productId: 1, quantity: 7 },
      { productId: 3, quantity: 1 },
    ]);
  });

  test('cash payment returns change and rejects too little money', () => {
    expect(calculatePayment(150000, 'CASH', 200000)).toEqual({ paidAmount: 200000, changeAmount: 50000 });
    expect(calculatePayment(150000, 'CASH', 100000)).toBeNull();
    expect(calculatePayment(150000, 'CASH')).toEqual({ paidAmount: 150000, changeAmount: 0 });
  });

  test('transfer and e-wallet always pay the exact total', () => {
    expect(calculatePayment(410000, 'TRANSFER', 999999)).toEqual({ paidAmount: 410000, changeAmount: 0 });
    expect(calculatePayment(410000, 'EWALLET')).toEqual({ paidAmount: 410000, changeAmount: 0 });
  });

  test('money is rounded to 2 decimals', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});
