import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoriesApi } from '../../api/catalog.api';
import { queryKeys } from '../../hooks/queries';
import { useApiMutation } from '../../hooks/useApiMutation';
import { categorySchema } from '../../schemas/forms.schema';
import { applyFieldErrors } from '../../utils/errors';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/FormField';

// One modal handles both create (no category) and edit (category given)
export default function CategoryFormModal({ isOpen, category, onClose }) {
  const isEdit = !!category;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(categorySchema), values: { name: category?.name || '' } });

  const save = useApiMutation((values) => (isEdit ? categoriesApi.update(category.id, values) : categoriesApi.create(values)), {
    invalidate: [queryKeys.categories, queryKeys.products],
    successMessage: isEdit ? 'Category updated' : 'Category created',
    onSuccess: onClose,
  });

  const onSubmit = (values) => save.mutate(values, { onError: (error) => applyFieldErrors(error, setError) });

  return (
    <Modal
      isOpen={isOpen}
      title={isEdit ? 'Edit category' : 'New category'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" isLoading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input id="category-name" label="Name" error={errors.name?.message} {...register('name')} />
      </form>
    </Modal>
  );
}
