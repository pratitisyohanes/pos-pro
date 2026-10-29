import { Link } from 'react-router-dom';
import { useAllTransactions, useBookingSummary, useLowStock, useSales, useSalesSummary } from '../../hooks/queries';
import RevenueChart from '../../components/charts/RevenueChart';
import StatCard from '../../components/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';
import { formatDateTime, formatRupiah } from '../../utils/format';
import { TRANSACTION_STATUS, UNIT_LABEL } from '../../utils/constants';
import { BOOKING_URL } from '../../utils/config';

export default function DashboardPage() {
  const summary = useSalesSummary({ period: 'this_month' });
  const sales = useSales({ period: 'this_month', groupBy: 'day' });
  const lowStock = useLowStock({ limit: 5 });
  const pending = useAllTransactions({ status: 'PENDING', limit: 5 });
  const booking = useBookingSummary({ period: 'this_month' });

  if (summary.isLoading) return <PageLoader />;
  if (summary.error) return <ErrorState error={summary.error} onRetry={summary.refetch} />;

  const data = summary.data;

  return (
    <>
      <PageHeader title="Dashboard" description="This month at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sales revenue" value={formatRupiah(data.totalRevenue)} hint={`${data.salesCount} paid sales`} />
        <StatCard label="Items sold" value={data.itemsSold} hint={`Average sale ${formatRupiah(data.averageSale)}`} />
        <StatCard label="Awaiting payment" value={data.pendingOrders} hint="Self-orders to collect at the counter" />
        <StatCard label="Low stock products" value={data.lowStockCount} hint="At or below minimum stock" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-800">Farm services (booking app)</h2>
          <a href={`${BOOKING_URL}/admin`} className="text-sm font-medium text-brand-700 hover:underline">
            Open booking admin
          </a>
        </div>
        {booking.isLoading && <p className="mt-2 text-sm text-slate-500">Loading booking figures...</p>}
        {booking.error && <p className="mt-2 text-sm text-slate-500">Booking figures are unavailable right now; sales above are not affected.</p>}
        {booking.data && (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-slate-500">Bookings</dt>
              <dd className="text-lg font-semibold tabular-nums">{booking.data.totalBookings}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Service revenue</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatRupiah(booking.data.totalRevenue)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Today&apos;s jobs</dt>
              <dd className="text-lg font-semibold tabular-nums">{booking.data.todayBookings}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Products + services</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatRupiah(data.totalRevenue + booking.data.totalRevenue)}</dd>
            </div>
          </dl>
        )}
      </div>

      <Card title="Daily sales">{sales.isLoading ? <PageLoader /> : <RevenueChart items={sales.data?.items} />}</Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Low stock" actions={<Link to="/admin/products?lowStock=true" className="text-sm font-medium text-brand-700 hover:underline">See all</Link>}>
          {lowStock.data?.items?.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {lowStock.data.items.map((product) => (
                <li key={product.id} className="flex justify-between py-2">
                  <span>{product.name}</span>
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

        <Card title="Awaiting payment" actions={<Link to="/admin/sales?status=PENDING" className="text-sm font-medium text-brand-700 hover:underline">See all</Link>}>
          {pending.data?.items?.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {pending.data.items.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-2 py-2">
                  <Link to={`/admin/sales/${order.id}`} className="font-medium text-brand-700 hover:underline">
                    {order.invoiceNo}
                  </Link>
                  <span className="text-slate-500">{order.customerName}</span>
                  <span className="tabular-nums">{formatRupiah(order.total)}</span>
                  <StatusBadge status={order.status} map={TRANSACTION_STATUS} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No orders waiting.</p>
          )}
          <p className="mt-3 text-xs text-slate-400">Updated {formatDateTime(new Date())}</p>
        </Card>
      </div>
    </>
  );
}
