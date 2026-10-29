import { StatusBadge } from './ui/Badge';
import { formatDateTime, formatRupiah } from '../utils/format';
import { PAYMENT_LABEL, TRANSACTION_STATUS, UNIT_LABEL } from '../utils/constants';
import { bookingServiceUrl } from '../utils/config';

// Receipt layout used on screen and, through .receipt-print, on 80 mm paper
export default function Receipt({ transaction }) {
  const installLinks = [
    ...new Map(
      transaction.items.filter((item) => item.product?.installServiceId).map((item) => [item.product.installServiceId, item.name]),
    ),
  ];

  return (
    <div className="space-y-4">
      <article className="receipt-print mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 font-mono text-sm">
        <header className="text-center">
          <p className="font-sans text-lg font-bold">KandangMart</p>
          <p className="text-xs text-slate-500">Layer farm supplies</p>
          <p className="mt-2 font-semibold">{transaction.invoiceNo}</p>
          <p className="text-xs text-slate-500">{formatDateTime(transaction.paidAt || transaction.createdAt)}</p>
          <div className="no-print mt-2">
            <StatusBadge status={transaction.status} map={TRANSACTION_STATUS} />
          </div>
        </header>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 border-y border-dashed border-slate-300 py-2 text-xs">
          <dt className="text-slate-500">Customer</dt>
          <dd className="text-right">{transaction.customerName}</dd>
          {transaction.cashierName && (
            <>
              <dt className="text-slate-500">Cashier</dt>
              <dd className="text-right">{transaction.cashierName}</dd>
            </>
          )}
        </dl>

        <ul className="divide-y divide-dashed divide-slate-200">
          {transaction.items.map((item) => (
            <li key={item.id} className="py-2">
              <p>{item.name}</p>
              <p className="flex justify-between text-xs text-slate-600">
                <span>
                  {item.quantity} {UNIT_LABEL[item.unit] || item.unit} x {formatRupiah(item.unitPrice)}
                </span>
                <span className="tabular-nums text-slate-900">{formatRupiah(item.lineTotal)}</span>
              </p>
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-[1fr_auto] gap-x-3 border-t border-dashed border-slate-300 pt-2 tabular-nums">
          <dt className="font-semibold">Total</dt>
          <dd className="text-right font-semibold">{formatRupiah(transaction.total)}</dd>
          {transaction.status === 'PAID' && (
            <>
              <dt className="text-slate-500">{PAYMENT_LABEL[transaction.paymentMethod]}</dt>
              <dd className="text-right">{formatRupiah(transaction.paidAmount)}</dd>
              <dt className="text-slate-500">Change</dt>
              <dd className="text-right">{formatRupiah(transaction.changeAmount)}</dd>
            </>
          )}
        </dl>
        {transaction.note && <p className="mt-3 text-xs text-slate-500">Note: {transaction.note}</p>}
        <p className="mt-4 text-center text-xs text-slate-500">Thank you for your purchase</p>
      </article>

      {transaction.status === 'PAID' && installLinks.length > 0 && (
        <div className="no-print mx-auto max-w-md rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm">
          <p className="font-medium text-brand-900">Need it installed?</p>
          <p className="mt-1 text-brand-700">Book our field team for these items:</p>
          <ul className="mt-2 space-y-1">
            {installLinks.map(([serviceId, itemName]) => (
              <li key={serviceId}>
                <a href={bookingServiceUrl(serviceId)} className="font-medium text-brand-700 underline">
                  Book installation for {itemName}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
