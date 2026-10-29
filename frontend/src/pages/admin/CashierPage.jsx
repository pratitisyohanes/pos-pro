import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingsApi, transactionsApi } from '../../api/sales.api';
import { queryKeys, useProducts } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import PaymentFields, { isPaymentEnough } from '../../components/admin/PaymentFields';
import QuantityStepper from '../../components/QuantityStepper';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/FormField';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatRupiah } from '../../utils/format';
import { UNIT_LABEL } from '../../utils/constants';

export default function CashierPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState([]);
  const [bookingCode, setBookingCode] = useState('');
  const [booking, setBooking] = useState(null);
  const [isLooking, setIsLooking] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [method, setMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');

  const products = useProducts({ search, status: 'ACTIVE', limit: 12, sort: 'name:asc' });

  const productsTotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const total = productsTotal + (booking?.totalPrice || 0);

  const addProduct = (product) => {
    if (product.stock <= 0) return toast.error(`${product.name} is out of stock`);
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => (line.productId === product.id ? { ...line, quantity: Math.min(line.quantity + 1, product.stock) } : line));
      }
      return [...current, { productId: product.id, name: product.name, unit: product.unit, price: Number(product.price), stock: product.stock, quantity: 1 }];
    });
    return undefined;
  };

  // A scanner types the SKU and presses Enter; an exact match goes straight into the cart
  const addBySku = (event) => {
    if (event.key !== 'Enter') return;
    const match = products.data?.items.find((product) => product.sku.toLowerCase() === event.currentTarget.value.trim().toLowerCase());
    if (match) addProduct(match);
  };

  const lookupBooking = async () => {
    if (!bookingCode.trim()) return;
    setIsLooking(true);
    try {
      const found = await bookingsApi.lookup(bookingCode);
      if (!found.canSettle) {
        toast.error(found.payment.status === 'PAID' ? `${found.bookingCode} is already paid` : `${found.bookingCode} is ${found.status}; confirm it in the booking app first`);
        return;
      }
      setBooking(found);
      if (!customerName) setCustomerName(found.customer.name);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLooking(false);
    }
  };

  const reset = () => {
    setLines([]);
    setBooking(null);
    setBookingCode('');
    setCustomerName('');
    setPaidAmount('');
  };

  const checkout = useApiMutation(transactionsApi.checkout, {
    invalidate: [queryKeys.transactions, queryKeys.products, queryKeys.movements, queryKeys.reports],
    successMessage: 'Sale completed',
    onSuccess: (sale) => {
      reset();
      navigate(`/admin/sales/${sale.id}`);
    },
  });

  const submit = () =>
    checkout.mutate({
      items: lines.map(({ productId, quantity }) => ({ productId, quantity })),
      bookingCode: booking?.bookingCode,
      customerName: customerName.trim() || undefined,
      paymentMethod: method,
      paidAmount: method === 'CASH' ? Number(paidAmount || 0) : undefined,
    });

  const canPay = (lines.length > 0 || booking) && isPaymentEnough(total, method, paidAmount);

  return (
    <>
      <PageHeader title="Cashier" description="Sell products and settle confirmed bookings on one receipt." />

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <section className="space-y-4">
          <div onKeyDown={addBySku}>
            <SearchInput id="cashier-search" value={search} onChange={setSearch} placeholder="Search or scan SKU, press Enter to add" />
          </div>
          {products.isLoading && <PageLoader />}
          {products.error && <ErrorState error={products.error} onRetry={products.refetch} />}
          {products.data && !products.data.items.length && <EmptyState title="No products found" />}
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {products.data?.items.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                disabled={product.stock <= 0}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-500 disabled:opacity-50"
              >
                <code className="text-xs text-slate-400">{product.sku}</code>
                <p className="mt-1 font-medium text-slate-900">{product.name}</p>
                <p className="mt-2 flex justify-between text-sm">
                  <span className="font-semibold tabular-nums">{formatRupiah(product.price)}</span>
                  <span className={product.stock <= product.minStock ? 'text-red-600' : 'text-slate-500'}>
                    {product.stock} {UNIT_LABEL[product.unit]}
                  </span>
                </p>
              </button>
            ))}
          </div>
        </section>

        <aside className="h-fit space-y-5 rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-20">
          <div className="space-y-2">
            <h2 className="font-semibold text-slate-900">Booking from the services app</h2>
            {booking ? (
              <div className="rounded-lg bg-brand-50 p-3 text-sm">
                <p className="font-medium text-brand-900">
                  {booking.bookingCode} · {booking.service.name}
                </p>
                <p className="text-brand-700">
                  {booking.customer.name} · {formatDate(booking.schedule.date)} {booking.schedule.startTime}
                </p>
                <p className="mt-1 flex justify-between">
                  <span className="font-semibold tabular-nums">{formatRupiah(booking.totalPrice)}</span>
                  <button type="button" className="text-red-600 hover:underline" onClick={() => setBooking(null)}>
                    Remove
                  </button>
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input id="booking-code" aria-label="Booking code" placeholder="BK-SEED-0009" value={bookingCode} onChange={(event) => setBookingCode(event.target.value)} />
                <Button variant="secondary" isLoading={isLooking} onClick={lookupBooking}>
                  Find
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-slate-900">Cart</h2>
            {lines.length === 0 && <p className="text-sm text-slate-500">Click a product to add it.</p>}
            <ul className="divide-y divide-slate-100">
              {lines.map((line) => (
                <li key={line.productId} className="space-y-1 py-2">
                  <p className="flex justify-between gap-2 text-sm">
                    <span className="font-medium">{line.name}</span>
                    <span className="tabular-nums">{formatRupiah(line.price * line.quantity)}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <QuantityStepper
                      id={`cashier-qty-${line.productId}`}
                      value={line.quantity}
                      max={line.stock}
                      onChange={(quantity) => setLines((current) => current.map((item) => (item.productId === line.productId ? { ...item, quantity } : item)))}
                    />
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setLines((current) => current.filter((item) => item.productId !== line.productId))}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Input id="customer-name" label="Customer name" placeholder="Walk-in customer" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />

          <p className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(total)}</span>
          </p>

          <PaymentFields idPrefix="cashier" total={total} method={method} paidAmount={paidAmount} onMethodChange={setMethod} onPaidChange={setPaidAmount} />

          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset} disabled={checkout.isPending}>
              Clear
            </Button>
            <Button className="flex-1" disabled={!canPay} isLoading={checkout.isPending} onClick={submit}>
              Complete sale
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}
