import { Link } from 'react-router-dom';
import { useCategories, useProducts } from '../../hooks/queries';
import ProductCard from '../../components/ProductCard';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { BOOKING_URL } from '../../utils/config';

export default function HomePage() {
  const products = useProducts({ limit: 6, sort: 'createdAt:desc' });
  const categories = useCategories();

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-8 overflow-hidden rounded-2xl bg-brand-900 px-6 py-12 text-white sm:px-10 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">Layer farm supplies</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">Battery cages, feed and poultry health products in one shop.</h1>
          <p className="mt-4 max-w-xl text-brand-100">Check live stock, order online and pay at the counter, then book our field team to install your cages.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-900 hover:bg-brand-50">
              Browse products
            </Link>
            <a href={BOOKING_URL} className="rounded-lg border border-white/30 px-5 py-2.5 font-semibold text-white hover:bg-white/10">
              Book installation
            </a>
          </div>
        </div>
        <img src="/hero-shop.svg" alt="Farm supply shop with cages, feed sacks and poultry health products" className="hidden w-full max-w-lg justify-self-end lg:block" />
      </section>

      {categories.data?.items?.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.data.items.map((category) => (
              <Link
                key={category.id}
                to={`/products?categoryId=${category.id}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:border-brand-500 hover:text-brand-700"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-slate-900">New products</h2>
          <Link to="/products" className="text-sm font-medium text-brand-700 hover:underline">
            See all
          </Link>
        </div>
        {products.isLoading && <PageLoader />}
        {products.error && <ErrorState error={products.error} onRetry={products.refetch} />}
        {products.data && !products.data.items.length && <EmptyState title="No products available yet" />}
        {products.data?.items?.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
