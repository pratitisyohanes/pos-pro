import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { transactionsApi } from '../../api/sales.api';
import { queryKeys, useTransaction } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import Receipt from '../../components/Receipt';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';

export default function OrderDetailPage() {
  const { id } = useParams();
  const order = useTransaction(id);
  const [isCancelling, setIsCancelling] = useState(false);

  const cancel = useApiMutation(() => transactionsApi.cancel(id), {
    invalidate: [queryKeys.transactions, queryKeys.products],
    successMessage: 'Order cancelled',
    onSuccess: () => setIsCancelling(false),
  });

  if (order.isLoading) return <PageLoader />;
  if (order.error) return <ErrorState error={order.error} onRetry={order.refetch} />;

  const isPending = order.data.status === 'PENDING';

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/my-orders" className="text-sm font-medium text-brand-700 hover:underline">
          &larr; Back to my orders
        </Link>
        <div className="flex gap-2">
          {isPending && (
            <Button variant="secondary" className="text-red-600" onClick={() => setIsCancelling(true)}>
              Cancel order
            </Button>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {isPending && (
        <p className="no-print mx-auto max-w-md rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Show invoice <strong>{order.data.invoiceNo}</strong> at the counter to pay and collect your items.
        </p>
      )}

      <Receipt transaction={order.data} />

      <ConfirmDialog
        isOpen={isCancelling}
        title="Cancel this order?"
        message="The reserved items go back into stock."
        confirmLabel="Cancel order"
        isLoading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onClose={() => setIsCancelling(false)}
      />
    </div>
  );
}
