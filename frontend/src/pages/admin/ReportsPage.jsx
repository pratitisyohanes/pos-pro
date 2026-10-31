import { useState } from 'react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../api/sales.api';
import { useLowStock, useSales, useSalesSummary, useTopProducts } from '../../hooks/queries';
import { cleanParams, useUrlFilters } from '../../hooks/useUrlFilters';
import DateRangeFilter from '../../components/DateRangeFilter';
import RevenueChart from '../../components/charts/RevenueChart';
import HorizontalBarChart from '../../components/charts/HorizontalBarChart';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/FormField';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';
import { downloadBlobResponse } from '../../utils/download';
import { exportReportPdf } from '../../utils/reportPdf';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatRupiah } from '../../utils/format';
import { UNIT_LABEL } from '../../utils/constants';

// Without a period or range the backend reports the current month
const reportPeriods = (hasCustomRange) => [
  { value: '', label: hasCustomRange ? 'Custom range' : 'This month' },
  { value: 'this_week', label: 'This week' },
  { value: 'today', label: 'Today' },
];

const GROUP_OPTIONS = [
  { value: 'day', label: 'Per day' },
  { value: 'month', label: 'Per month' },
];

export default function ReportsPage() {
  const [filters, setFilters] = useUrlFilters({ groupBy: 'day' });
  const [downloading, setDownloading] = useState(null);

  const range = cleanParams({ period: filters.period, from: filters.from, to: filters.to });
  const summary = useSalesSummary(range);
  const topProducts = useTopProducts({ ...range, limit: 10 });
  const lowStock = useLowStock({ limit: 20 });
  const sales = useSales({ ...range, groupBy: filters.groupBy });

  const exportCsv = async (type) => {
    setDownloading(type);
    try {
      const response = await reportsApi.exportCsv({ ...range, type });
      downloadBlobResponse(response, `${type}.csv`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  };

  const exportPdf = async () => {
    setDownloading('pdf');
    try {
      await exportReportPdf({
        summary: summary.data,
        sales: sales.data,
        topProducts: topProducts.data,
        lowStock: lowStock.data,
        groupBy: filters.groupBy,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  };

  if (summary.error) return <ErrorState error={summary.error} onRetry={summary.refetch} />;

  return (
    <>
      <PageHeader
        title="Reports"
        description={summary.data ? `${formatDate(summary.data.range.start)} - ${formatDate(summary.data.range.end)}` : 'Sales analytics'}
        actions={
          <>
            <Button isLoading={downloading === 'pdf'} disabled={!summary.data || !sales.data || !topProducts.data || !lowStock.data} onClick={exportPdf}>
              Export PDF
            </Button>
            <Button variant="secondary" isLoading={downloading === 'transactions'} onClick={() => exportCsv('transactions')}>
              Download sales CSV
            </Button>
            <Button variant="secondary" isLoading={downloading === 'top-products'} onClick={() => exportCsv('top-products')}>
              Download top products CSV
            </Button>
          </>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <DateRangeFilter filters={filters} setFilters={setFilters} idPrefix="report" periodOptions={reportPeriods(!!(filters.from || filters.to))} />
      </div>

      {summary.isLoading ? (
        <PageLoader />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Revenue (paid)" value={formatRupiah(summary.data.totalRevenue)} />
          <StatCard label="Paid sales" value={summary.data.salesCount} />
          <StatCard label="Items sold" value={summary.data.itemsSold} />
          <StatCard label="Average sale" value={formatRupiah(summary.data.averageSale)} />
        </div>
      )}

      <Card
        title="Revenue"
        actions={
          <div className="w-36">
            <Select id="groupBy" aria-label="Group revenue" options={GROUP_OPTIONS} value={filters.groupBy} onChange={(event) => setFilters({ groupBy: event.target.value })} />
          </div>
        }
      >
        {sales.isLoading ? <PageLoader /> : <RevenueChart items={sales.data?.items} />}
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Best selling products (quantity)">
          {topProducts.isLoading ? <PageLoader /> : <HorizontalBarChart data={topProducts.data?.items} labelKey="productName" valueKey="quantitySold" />}
        </Card>
        <Card title="Low stock">
          {lowStock.data?.items?.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {lowStock.data.items.map((product) => (
                <li key={product.id} className="flex justify-between gap-2 py-2">
                  <span>
                    {product.name} <code className="text-xs text-slate-400">{product.sku}</code>
                  </span>
                  <span className="tabular-nums text-red-600">
                    {product.stock} / min {product.minStock} {UNIT_LABEL[product.unit]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">All products are above minimum stock.</p>
          )}
        </Card>
      </div>
    </>
  );
}
