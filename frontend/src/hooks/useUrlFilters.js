import { useSearchParams } from 'react-router-dom';

// Keep filters and pagination in the URL so a page can be refreshed or shared
export const useUrlFilters = (defaults = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = { ...defaults, ...Object.fromEntries(searchParams) };

  const setFilters = (changes) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) next.delete(key);
          else next.set(key, String(value));
        });
        // Any filter change except paging goes back to the first page
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  return [filters, setFilters];
};

// Drop empty values so they are not sent as query parameters
export const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null));
