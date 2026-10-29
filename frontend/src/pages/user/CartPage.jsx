import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { transactionsApi } from '../../api/sales.api';
import { queryKeys } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { selectCartTotal, useCartStore } from '../../store/cartStore';
import QuantityStepper from '../../components/QuantityStepper';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/FormField';
import { EmptyState } from '../../components/ui/States';
import { formatRupiah } from '../../utils/format';
import { UNIT_LABEL } from '../../utils/constants';

export default function CartPage() {
  const navigate = useNavigate();
  const { lines, setQuantity, remove, clear } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const [note, setNote] = useState('');

  const placeOrder = useApiMutation(transactionsApi.selfOrder, {
    invalidate: [queryKeys.transactions, queryKeys.products],
    successMessage: 'Order placed. Please pay at the counter.',
    onSuccess: (order) => {
      clear();
      navigate(`/my-orders/${order.id}`);
    },
  });

  if (!lines.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add cages, feed or health products to start an order."
        action={
          <Link to="/products" className="font-medium text-brand-700 hover:underline">
            Browse products
          </Link>
        }
      />
    );
  }

  const submit = () =>
    placeOrder.mutate({ items: lines.map(({ productId, quantity }) => ({ productId, quantity })), note: note.trim() || undefined });

  return (
    <div className="space-y-6">
      <PageHeader title="Cart" description="Stock is reserved when you place the order. Pay at the counter when you pick it up." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {lines.map((line) => (
            <li key={line.productId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{line.name}</p>
                <p className="text-sm text-slate-500">
                  {formatRupiah(line.price)} / {UNIT_LABEL[line.unit]}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <QuantityStepper id={`qty-${line.productId}`} value={line.quantity} max={line.stock} onChange={(quantity) => setQuantity(line.productId, quantity)} />
                <p className="w-28 text-right font-semibold tabular-nums">{formatRupiah(line.price * line.quantity)}</p>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => remove(line.productId)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(total)}</span>
          </div>
          <Textarea id="order-note" label="Note (optional)" value={note} maxLength={255} onChange={(event) => setNote(event.target.value)} placeholder="Pick-up time, delivery address..." />
          <Button className="w-full" isLoading={placeOrder.isPending} onClick={submit}>
            Place order
          </Button>
          <p className="text-xs text-slate-500">Prices and stock are checked again by the server when you place the order.</p>
        </aside>
      </div>
    </div>
  );
}
