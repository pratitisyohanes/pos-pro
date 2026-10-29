import { useCategories, useProducts } from '../../hooks/queries';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useAddToCart } from '../../hooks/useAddToCart';
import ProductCard from '../../components/ProductCard';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/FormField';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'price:asc', label: 'Lowest price' },
  { value: 'price:desc', label: 'Highest price' },
  { value: 'createdAt:desc', label: 'Newest' },
];

export default function ProductsPage() {
  const [filters, setFilters] = useUrlFilters({ sort: 'name:asc' });
  const categories = useCategories();
  const products = useProducts({ ...filters, limit: 9 });
  const addToCart = useAddToCart();

  const categoryOptions = (categories.data?.items || []).map((category) => ({ value: category.id, label: category.name }));

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Cages, equipment, feed and health products for laying hens." />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <SearchInput value={filters.search || ''} onChange={(search) => setFilters({ search })} placeholder="Search name or SKU" />
        <Select id="categoryId" aria-label="Category" placeholder="All categories" options={categoryOptions} value={filters.categoryId || ''} onChange={(event) => setFilters({ categoryId: event.target.value })} />
        <Select id="sort" aria-label="Sort" options={SORT_OPTIONS} value={filters.sort} onChange={(event) => setFilters({ sort: event.target.value })} />
      </div>

      {products.isLoading && <PageLoader />}
      {products.error && <ErrorState error={products.error} onRetry={products.refetch} />}
      {products.data && !products.data.items.length && <EmptyState title="No products match your search" description="Try another keyword or category." />}
      {products.data?.items?.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              action={
                <Button size="sm" disabled={product.stock <= 0} onClick={() => addToCart(product)}>
                  Add to cart
                </Button>
              }
            />
          ))}
        </div>
      )}
      <Pagination meta={products.data?.meta} onPageChange={(page) => setFilters({ page })} />
    </div>
  );
}
