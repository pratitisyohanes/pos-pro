import { useState } from 'react';
import { categoriesApi } from '../../api/catalog.api';
import { queryKeys, useCategories } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import CategoryFormModal from '../../components/admin/CategoryFormModal';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';

export default function CategoriesPage() {
  const [filters, setFilters] = useUrlFilters();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const categories = useCategories({ ...filters, limit: 10 });

  const remove = useApiMutation((id) => categoriesApi.remove(id), {
    invalidate: [queryKeys.categories],
    successMessage: 'Category deleted',
    onSuccess: () => setDeleting(null),
  });

  const columns = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { key: 'slug', header: 'Slug', render: (row) => <code className="text-xs text-slate-500">{row.slug}</code> },
    { key: 'productCount', header: 'Products', render: (row) => Number(row.productCount || 0) },
    {
      key: 'actions',
      header: '',
      className: 'text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex justify-end gap-1">
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
      <PageHeader title="Categories" description="Group products so customers can filter them." actions={<Button onClick={() => setEditing({})}>New category</Button>} />

      <div className="max-w-sm">
        <SearchInput value={filters.search || ''} onChange={(search) => setFilters({ search })} placeholder="Search categories" />
      </div>

      <DataTable columns={columns} rows={categories.data?.items} isLoading={categories.isLoading} error={categories.error} onRetry={categories.refetch} emptyTitle="No categories found" />
      <Pagination meta={categories.data?.meta} onPageChange={(page) => setFilters({ page })} />

      {editing && <CategoryFormModal isOpen category={editing.id ? editing : null} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        isOpen={!!deleting}
        title="Delete category?"
        message={`"${deleting?.name}" can only be deleted when no product uses it.`}
        confirmLabel="Delete"
        isLoading={remove.isPending}
        onConfirm={() => remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
