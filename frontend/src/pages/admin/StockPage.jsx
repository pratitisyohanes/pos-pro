import { useStockMovements } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import DateRangeFilter from '../../components/DateRangeFilter';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/FormField';
import { formatDateTime } from '../../utils/format';
import { MOVEMENT_TYPE, UNIT_LABEL, toOptions } from '../../utils/constants';

export default function StockPage() {
  const [filters, setFilters] = useUrlFilters();
  const movements = useStockMovements({ ...filters, limit: 15 });

  const columns = [
    { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'product',
      header: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.product?.name}</p>
          <code className="text-xs text-slate-500">{row.product?.sku}</code>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => <StatusBadge status={row.type} map={MOVEMENT_TYPE} /> },
    {
      key: 'quantity',
      header: 'Change',
      className: 'text-right',
      render: (row) => (
        <span className={`tabular-nums font-medium ${row.quantity < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    { key: 'stockAfter', header: 'Stock after', className: 'text-right', render: (row) => <span className="tabular-nums">{row.stockAfter} {UNIT_LABEL[row.product?.unit]}</span> },
    { key: 'actorName', header: 'By', render: (row) => row.actorName || '-' },
    { key: 'note', header: 'Note', render: (row) => <span className="text-slate-500">{row.note || '-'}</span> },
  ];

  return (
    <>
      <PageHeader title="Stock history" description="Every change to stock: sales, cancelled orders, restocks and corrections." />

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="max-w-xs">
          <Select id="type" aria-label="Type" placeholder="All types" options={toOptions(MOVEMENT_TYPE)} value={filters.type || ''} onChange={(event) => setFilters({ type: event.target.value })} />
        </div>
        <DateRangeFilter filters={filters} setFilters={setFilters} idPrefix="stock" />
      </div>

      <DataTable columns={columns} rows={movements.data?.items} isLoading={movements.isLoading} error={movements.error} onRetry={movements.refetch} emptyTitle="No stock movements found" />
      <Pagination meta={movements.data?.meta} onPageChange={(page) => setFilters({ page })} />
    </>
  );
}
