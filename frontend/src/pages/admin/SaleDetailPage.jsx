import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { transactionsApi } from '../../api/sales.api';
import { queryKeys, useTransaction } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import PaymentFields, { isPaymentEnough } from '../../components/admin/PaymentFields';
import Receipt from '../../components/Receipt';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';

const INVALIDATE = [queryKeys.transactions, queryKeys.products, queryKeys.movements, queryKeys.reports];

export default function SaleDetailPage() {
  const { id } = useParams();
  const sale = useTransaction(id);
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [method, setMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');

  const pay = useApiMutation(() => transactionsApi.pay(id, { paymentMethod: method, paidAmount: method === 'CASH' ? Number(paidAmount || 0) : undefined }), {
    invalidate: INVALIDATE,
    successMessage: 'Payment recorded',
    onSuccess: () => setIsPaying(false),
  });

  const cancel = useApiMutation(() => transactionsApi.cancel(id), {
    invalidate: INVALIDATE,
    successMessage: 'Order cancelled, stock returned',
    onSuccess: () => setIsCancelling(false),
  });

  if (sale.isLoading) return <PageLoader />;
  if (sale.error) return <ErrorState error={sale.error} onRetry={sale.refetch} />;

  const total = Number(sale.data.total);
  const isPending = sale.data.status === 'PENDING';

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/sales" className="text-sm font-medium text-brand-700 hover:underline">
          &larr; Back to sales
        </Link>
        <div className="flex gap-2">
          {isPending && (
            <>
              <Button variant="secondary" className="text-red-600" onClick={() => setIsCancelling(true)}>
                Cancel order
              </Button>
              <Button onClick={() => setIsPaying(true)}>Record payment</Button>
            </>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            Print receipt
          </Button>
        </div>
      </div>

      <Receipt transaction={sale.data} />

      <Modal
        isOpen={isPaying}
        title={`Pay ${sale.data.invoiceNo}`}
        onClose={() => setIsPaying(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsPaying(false)}>
              Cancel
            </Button>
            <Button disabled={!isPaymentEnough(total, method, paidAmount)} isLoading={pay.isPending} onClick={() => pay.mutate()}>
              Confirm payment
            </Button>
          </>
        }
      >
        <PaymentFields idPrefix="pay" total={total} method={method} paidAmount={paidAmount} onMethodChange={setMethod} onPaidChange={setPaidAmount} />
      </Modal>

      <ConfirmDialog
        isOpen={isCancelling}
        title="Cancel this order?"
        message="The reserved items go back into stock. This cannot be undone."
        confirmLabel="Cancel order"
        isLoading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onClose={() => setIsCancelling(false)}
      />
    </>
  );
}
