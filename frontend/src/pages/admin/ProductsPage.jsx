import { useState } from 'react';
import { productsApi } from '../../api/catalog.api';
import { queryKeys, useCategories, useProducts } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import ProductFormModal from '../../components/admin/ProductFormModal';
import StockAdjustModal from '../../components/admin/StockAdjustModal';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/FormField';
import { formatRupiah } from '../../utils/format';
import { PRODUCT_STATUS, UNIT_LABEL, isLowStock, toOptions } from '../../utils/constants';

const STOCK_FILTER = [{ value: 'true', label: 'Low stock only' }];

export default function ProductsPage() {
  const [filters, setFilters] = useUrlFilters();
  const [editing, setEditing] = useState(null);
  const [stocking, setStocking] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const products = useProducts({ ...filters, limit: 10 });
  const categories = useCategories();
  const categoryOptions = (categories.data?.items || []).map((category) => ({ value: category.id, label: category.name }));

  const remove = useApiMutation((id) => productsApi.remove(id), {
    invalidate: [queryKeys.products, queryKeys.categories],
    successMessage: 'Product deleted',
    onSuccess: () => setDeleting(null),
  });

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          <code className="text-xs text-slate-500">{row.sku}</code>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => row.category?.name },
    { key: 'price', header: 'Price', className: 'text-right', render: (row) => <span className="tabular-nums">{formatRupiah(row.price)}</span> },
    {
      key: 'stock',
      header: 'Stock',
      className: 'text-right',
      render: (row) => (
        <span className={`tabular-nums ${isLowStock(row) ? 'font-semibold text-red-600' : ''}`}>
          {row.stock} {UNIT_LABEL[row.unit]}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} map={PRODUCT_STATUS} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setStocking(row)}>
            Stock
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Products" description="Catalog, prices and stock levels." actions={<Button onClick={() => setEditing({})}>New product</Button>} />

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <SearchInput value={filters.search || ''} onChange={(search) => setFilters({ search })} placeholder="Name, SKU or category" />
        <Select id="categoryId" aria-label="Category" placeholder="All categories" options={categoryOptions} value={filters.categoryId || ''} onChange={(event) => setFilters({ categoryId: event.target.value })} />
        <Select id="status" aria-label="Status" placeholder="All statuses" options={toOptions(PRODUCT_STATUS)} value={filters.status || ''} onChange={(event) => setFilters({ status: event.target.value })} />
        <Select id="lowStock" aria-label="Stock level" placeholder="Any stock level" options={STOCK_FILTER} value={filters.lowStock || ''} onChange={(event) => setFilters({ lowStock: event.target.value })} />
      </div>

      <DataTable columns={columns} rows={products.data?.items} isLoading={products.isLoading} error={products.error} onRetry={products.refetch} emptyTitle="No products found" />
      <Pagination meta={products.data?.meta} onPageChange={(page) => setFilters({ page })} />

      {editing && <ProductFormModal isOpen product={editing.id ? editing : null} onClose={() => setEditing(null)} />}
      {stocking && <StockAdjustModal product={stocking} onClose={() => setStocking(null)} />}

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete product?"
        message={`"${deleting?.name}" disappears from the catalog. Old receipts keep showing it.`}
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
