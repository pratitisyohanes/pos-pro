import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsApi } from '../../api/catalog.api';
import { queryKeys, useCategories } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { productSchema } from '../../schemas/forms.schema';
import { applyFieldErrors } from '../../utils/errors';
import { PRODUCT_STATUS, UNIT_OPTIONS, toOptions } from '../../utils/constants';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormField';

const toFormValues = (product) => ({
  categoryId: product?.categoryId ?? '',
  sku: product?.sku ?? '',
  name: product?.name ?? '',
  description: product?.description ?? '',
  unit: product?.unit ?? 'PCS',
  price: product ? Number(product.price) : '',
  stock: product?.stock ?? 0,
  minStock: product?.minStock ?? 0,
  installServiceId: product?.installServiceId ?? '',
  status: product?.status ?? 'ACTIVE',
  imageUrl: product?.imageUrl ?? '',
});

// Stock is only set on create; later changes go through the stock modal so they are logged
const toPayload = ({ stock, installServiceId, ...values }, isEdit) => ({
  ...values,
  installServiceId: installServiceId === '' ? null : installServiceId,
  ...(!isEdit && { stock }),
});

export default function ProductFormModal({ isOpen, product, onClose }) {
  const isEdit = !!product;
  const categories = useCategories();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(productSchema), values: toFormValues(product) });

  const save = useApiMutation(
    (values) => (isEdit ? productsApi.update(product.id, toPayload(values, true)) : productsApi.create(toPayload(values, false))),
    { invalidate: [queryKeys.products, queryKeys.categories, queryKeys.movements], successMessage: isEdit ? 'Product updated' : 'Product created', onSuccess: onClose },
  );

  const onSubmit = (values) => save.mutate(values, { onError: (error) => applyFieldErrors(error, setError) });
  const categoryOptions = (categories.data?.items || []).map((category) => ({ value: category.id, label: category.name }));

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title={isEdit ? 'Edit product' : 'New product'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" isLoading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Select id="product-category" label="Category" placeholder="Choose a category" options={categoryOptions} error={errors.categoryId?.message} {...register('categoryId')} />
        <Input id="product-sku" label="SKU" placeholder="CG-BAT-2D" error={errors.sku?.message} {...register('sku')} />
        <div className="sm:col-span-2">
          <Input id="product-name" label="Name" error={errors.name?.message} {...register('name')} />
        </div>
        <div className="sm:col-span-2">
          <Textarea id="product-description" label="Description" error={errors.description?.message} {...register('description')} />
        </div>
        <Input id="product-price" type="number" min="0" label="Price (Rp)" error={errors.price?.message} {...register('price')} />
        <Select id="product-unit" label="Unit" options={UNIT_OPTIONS} error={errors.unit?.message} {...register('unit')} />
        {isEdit ? (
          <Input id="product-stock" label="Stock" value={product.stock} disabled hint="Use Restock / Adjust to change stock" readOnly />
        ) : (
          <Input id="product-stock" type="number" min="0" label="Opening stock" error={errors.stock?.message} {...register('stock')} />
        )}
        <Input id="product-min-stock" type="number" min="0" label="Minimum stock" hint="Shown as low stock at or below this number" error={errors.minStock?.message} {...register('minStock')} />
        <Input
          id="product-install-service"
          type="number"
          min="1"
          label="Installation service id (booking app)"
          hint="Optional, e.g. 2 = Battery Cage Installation"
          error={errors.installServiceId?.message}
          {...register('installServiceId')}
        />
        <Select id="product-status" label="Status" options={toOptions(PRODUCT_STATUS)} error={errors.status?.message} {...register('status')} />
        <div className="sm:col-span-2">
          <Input id="product-image" label="Image URL" placeholder="https://... or /products/name.svg" error={errors.imageUrl?.message} {...register('imageUrl')} />
        </div>
      </form>
    </Modal>
  );
}
