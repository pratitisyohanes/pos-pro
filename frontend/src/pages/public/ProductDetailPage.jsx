import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProduct } from '../../hooks/queries';
import { useAddToCart } from '../../hooks/useAddToCart';
import QuantityStepper from '../../components/QuantityStepper';
import Badge from '../../components/ui/Badge';
import ProductImage from '../../components/ProductImage';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/States';
import { formatRupiah } from '../../utils/format';
import { UNIT_LABEL } from '../../utils/constants';
import { bookingServiceUrl } from '../../utils/config';

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = useProduct(id);
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();

  if (product.isLoading) return <PageLoader />;
  if (product.error) return <ErrorState error={product.error} onRetry={product.refetch} />;

  const item = product.data;
  const unit = UNIT_LABEL[item.unit];

  return (
    <div className="space-y-6">
      <Link to="/products" className="text-sm font-medium text-brand-700 hover:underline">
        &larr; Back to products
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <ProductImage product={item} className="h-64 w-full sm:h-80" />
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{item.category?.name}</Badge>
              <code className="text-xs text-slate-400">{item.sku}</code>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{item.name}</h1>
            <p className="mt-3 whitespace-pre-line text-slate-600">{item.description || 'No description yet.'}</p>
            {item.installServiceId && (
              <p className="mt-6 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
                Our field team can install this for you.{' '}
                <a href={bookingServiceUrl(item.installServiceId)} className="font-medium underline">
                  Book installation
                </a>
              </p>
            )}
          </div>
        </section>

        <aside className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-3xl font-bold tabular-nums text-slate-900">{formatRupiah(item.price)}</p>
          <p className="text-sm text-slate-500">per {unit}</p>
          <p className={`text-sm ${item.stock > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {item.stock > 0 ? `${item.stock} ${unit} in stock` : 'Out of stock'}
          </p>
          {item.stock > 0 && (
            <>
              <QuantityStepper id="detail-quantity" value={quantity} max={item.stock} onChange={setQuantity} />
              <Button className="w-full" onClick={() => addToCart(item, quantity)}>
                Add to cart
              </Button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
