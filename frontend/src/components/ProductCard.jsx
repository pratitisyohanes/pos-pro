import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import { formatRupiah } from '../utils/format';
import { UNIT_LABEL } from '../utils/constants';

export default function ProductCard({ product, action }) {
  const outOfStock = product.stock <= 0;

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Badge>{product.category?.name}</Badge>
        <code className="text-xs text-slate-400">{product.sku}</code>
      </div>
      <Link to={`/products/${product.id}`} className="mt-3 font-semibold text-slate-900 hover:text-brand-700">
        {product.name}
      </Link>
      {product.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>}
      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div>
          <p className="text-lg font-bold tabular-nums text-slate-900">{formatRupiah(product.price)}</p>
          <p className={`text-xs ${outOfStock ? 'text-red-600' : 'text-slate-500'}`}>
            {outOfStock ? 'Out of stock' : `${product.stock} ${UNIT_LABEL[product.unit]} in stock`}
          </p>
        </div>
        {action}
      </div>
    </article>
  );
}
