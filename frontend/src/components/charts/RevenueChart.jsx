import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatRupiah } from '../../utils/format';

// Short axis labels such as 1.5M or 250K keep the chart readable on small screens
const compactRupiah = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function RevenueChart({ items = [] }) {
  if (!items.length) return <p className="py-12 text-center text-sm text-slate-500">No paid sales in this period.</p>;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={items} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c27c2c" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#c27c2c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={compactRupiah} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={(value) => [formatRupiah(value), 'Revenue']} />
          <Area type="monotone" dataKey="revenue" stroke="#a5651f" strokeWidth={2} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
