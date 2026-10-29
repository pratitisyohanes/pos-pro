import { Input, Select } from '../ui/FormField';
import { PAYMENT_METHODS } from '../../utils/constants';
import { formatRupiah } from '../../utils/format';

// Method, cash received and change; shared by the cashier screen and the pay modal
export default function PaymentFields({ idPrefix, total, method, paidAmount, onMethodChange, onPaidChange }) {
  const isCash = method === 'CASH';
  const paid = Number(paidAmount || 0);
  const change = isCash ? paid - total : 0;

  return (
    <div className="space-y-3">
      <Select id={`${idPrefix}-method`} label="Payment method" options={PAYMENT_METHODS} value={method} onChange={(event) => onMethodChange(event.target.value)} />
      {isCash && (
        <>
          <Input id={`${idPrefix}-paid`} type="number" min="0" label="Cash received (Rp)" value={paidAmount} onChange={(event) => onPaidChange(event.target.value)} />
          <p className={`flex justify-between text-sm ${change < 0 ? 'text-red-600' : 'text-slate-600'}`}>
            <span>{change < 0 ? 'Still short' : 'Change'}</span>
            <span className="font-semibold tabular-nums">{formatRupiah(Math.abs(change))}</span>
          </p>
        </>
      )}
    </div>
  );
}

export const isPaymentEnough = (total, method, paidAmount) => method !== 'CASH' || Number(paidAmount || 0) >= total;
