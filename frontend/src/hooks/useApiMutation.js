import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errors';

// Wrap useMutation with a success toast, an error toast and cache invalidation
export const useApiMutation = (mutationFn, { invalidate = [], successMessage, onSuccess, showErrorToast = true } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      if (successMessage) toast.success(successMessage);
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      // Validation errors (422) are shown on the form fields instead
      if (showErrorToast && error?.response?.status !== 422) toast.error(getErrorMessage(error));
    },
  });
};
