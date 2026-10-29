// Read the message from the backend error envelope { success: false, message, errors? }
export const getErrorMessage = (error, fallback = 'Something went wrong, please try again') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server, check your connection';
  return error?.message || fallback;
};

// Show backend validation errors (422) next to the matching react-hook-form fields
export const applyFieldErrors = (error, setError) => {
  const fieldErrors = error?.response?.data?.errors;
  if (!Array.isArray(fieldErrors)) return false;

  fieldErrors.forEach(({ field, message }) => setError(field, { type: 'server', message }));
  return fieldErrors.length > 0;
};
