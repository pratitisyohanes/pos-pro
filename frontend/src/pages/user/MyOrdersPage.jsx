import { Link } from 'react-router-dom';
import { useMyOrders } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/FormField';
import { formatDateTime, formatRupiah } from '../../utils/format';
import { TRANSACTION_STATUS, toOptions } from '../../utils/constants';

export default function MyOrdersPage() {
  const [filters, setFilters] = useUrlFilters();
  const orders = useMyOrders({ ...filters, limit: 10 });

  const columns = [
    {
      key: 'invoiceNo',
      header: 'Invoice',
      render: (row) => (
        <Link to={`/my-orders/${row.id}`} className="font-medium text-brand-700 hover:underline">
          {row.invoiceNo}
        </Link>
      ),
    },
    { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
    { key: 'total', header: 'Total', className: 'text-right', render: (row) => <span className="tabular-nums">{formatRupiah(row.total)}</span> },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} map={TRANSACTION_STATUS} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Orders" description="Self-orders and purchases made at the counter with your account." />
      <div className="max-w-xs">
        <Select id="status" aria-label="Status" placeholder="All statuses" options={toOptions(TRANSACTION_STATUS)} value={filters.status || ''} onChange={(event) => setFilters({ status: event.target.value })} />
      </div>
      <DataTable columns={columns} rows={orders.data?.items} isLoading={orders.isLoading} error={orders.error} onRetry={orders.refetch} emptyTitle="No orders yet" />
      <Pagination meta={orders.data?.meta} onPageChange={(page) => setFilters({ page })} />
    </div>
  );
}
