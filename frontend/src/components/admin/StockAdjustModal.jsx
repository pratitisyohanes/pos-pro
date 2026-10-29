import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productsApi } from '../../api/catalog.api';
import { queryKeys } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { stockSchema } from '../../schemas/forms.schema';
import { applyFieldErrors } from '../../utils/errors';
import { UNIT_LABEL } from '../../utils/constants';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormField';

const TYPE_OPTIONS = [
  { value: 'RESTOCK', label: 'Restock (goods received)' },
  { value: 'ADJUST', label: 'Adjust (stock take correction)' },
];

export default function StockAdjustModal({ product, onClose }) {
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(stockSchema), defaultValues: { type: 'RESTOCK', quantity: '', note: '' } });

  const save = useApiMutation((values) => productsApi.adjustStock(product.id, { ...values, note: values.note || undefined }), {
    invalidate: [queryKeys.products, queryKeys.movements, queryKeys.reports],
    onSuccess: onClose,
    successMessage: 'Stock updated',
  });

  const onSubmit = (values) => save.mutate(values, { onError: (error) => applyFieldErrors(error, setError) });
  const isAdjust = watch('type') === 'ADJUST';

  return (
    <Modal
      isOpen
      title={`Stock: ${product.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="stock-form" isLoading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="stock-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <p className="text-sm text-slate-600">
          Current stock: <strong className="tabular-nums">{product.stock}</strong> {UNIT_LABEL[product.unit]}
        </p>
        <Select id="stock-type" label="Type" options={TYPE_OPTIONS} {...register('type')} />
        <Input
          id="stock-quantity"
          type="number"
          label="Quantity"
          hint={isAdjust ? 'Use a negative number for missing or damaged items' : 'Number of units received'}
          error={errors.quantity?.message}
          {...register('quantity')}
        />
        <Input id="stock-note" label="Note" placeholder="Supplier delivery, damaged in transit..." error={errors.note?.message} {...register('note')} />
      </form>
    </Modal>
  );
}
