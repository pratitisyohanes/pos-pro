import { Link } from 'react-router-dom';
import { useAllTransactions } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import DateRangeFilter from '../../components/DateRangeFilter';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/FormField';
import { formatDateTime, formatRupiah } from '../../utils/format';
import { CHANNEL, PAYMENT_LABEL, TRANSACTION_STATUS, toOptions } from '../../utils/constants';

export default function SalesPage() {
  const [filters, setFilters] = useUrlFilters();
  const transactions = useAllTransactions({ ...filters, limit: 10 });

  const columns = [
    {
      key: 'invoiceNo',
      header: 'Invoice',
      render: (row) => (
        <Link to={`/admin/sales/${row.id}`} className="font-medium text-brand-700 hover:underline">
          {row.invoiceNo}
        </Link>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
    { key: 'customerName', header: 'Customer' },
    { key: 'channel', header: 'Channel', render: (row) => <StatusBadge status={row.channel} map={CHANNEL} /> },
    { key: 'paymentMethod', header: 'Payment', render: (row) => PAYMENT_LABEL[row.paymentMethod] || '-' },
    { key: 'total', header: 'Total', className: 'text-right', render: (row) => <span className="tabular-nums">{formatRupiah(row.total)}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} map={TRANSACTION_STATUS} /> },
  ];

  return (
    <>
      <PageHeader title="Sales" description="Every cashier sale and customer self-order." />

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SearchInput value={filters.search || ''} onChange={(search) => setFilters({ search })} placeholder="Invoice or customer" />
          <Select id="status" aria-label="Status" placeholder="All statuses" options={toOptions(TRANSACTION_STATUS)} value={filters.status || ''} onChange={(event) => setFilters({ status: event.target.value })} />
          <Select id="channel" aria-label="Channel" placeholder="All channels" options={toOptions(CHANNEL)} value={filters.channel || ''} onChange={(event) => setFilters({ channel: event.target.value })} />
        </div>
        <DateRangeFilter filters={filters} setFilters={setFilters} idPrefix="sales" />
      </div>

      <DataTable columns={columns} rows={transactions.data?.items} isLoading={transactions.isLoading} error={transactions.error} onRetry={transactions.refetch} emptyTitle="No transactions found" />
      <Pagination meta={transactions.data?.meta} onPageChange={(page) => setFilters({ page })} />
    </>
  );
}
