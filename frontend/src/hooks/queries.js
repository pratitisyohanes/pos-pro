import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '../api/catalog.api';
import { reportsApi, transactionsApi } from '../api/sales.api';
import { cleanParams } from './useUrlFilters';

// Query keys are shared with mutations so they can invalidate the right cache
export const queryKeys = {
  categories: ['categories'],
  products: ['products'],
  movements: ['movements'],
  transactions: ['transactions'],
  reports: ['reports'],
};

const listQuery = (key, fetcher, params, options = {}) => ({
  queryKey: [...key, 'list', cleanParams(params)],
  queryFn: () => fetcher(cleanParams(params)),
  placeholderData: keepPreviousData,
  ...options,
});

export const useCategories = (params = { limit: 100 }) =>
  useQuery(listQuery(queryKeys.categories, categoriesApi.list, params, { staleTime: 5 * 60 * 1000 }));

export const useProducts = (params) => useQuery(listQuery(queryKeys.products, productsApi.list, params));

export const useProduct = (id) =>
  useQuery({ queryKey: [...queryKeys.products, 'detail', id], queryFn: () => productsApi.getById(id), enabled: !!id });

export const useStockMovements = (params) => useQuery(listQuery(queryKeys.movements, productsApi.listMovements, params));

export const useMyOrders = (params) => useQuery(listQuery([...queryKeys.transactions, 'mine'], transactionsApi.listMine, params));

export const useAllTransactions = (params) =>
  useQuery(listQuery([...queryKeys.transactions, 'all'], transactionsApi.listAll, params));

export const useTransaction = (id) =>
  useQuery({ queryKey: [...queryKeys.transactions, 'detail', id], queryFn: () => transactionsApi.getById(id), enabled: !!id });

const useReportQuery = (name, fetcher, params, options = {}) =>
  useQuery({
    queryKey: [...queryKeys.reports, name, cleanParams(params)],
    queryFn: () => fetcher(cleanParams(params)),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useSalesSummary = (params) => useReportQuery('summary', reportsApi.summary, params);
export const useTopProducts = (params) => useReportQuery('top-products', reportsApi.topProducts, params);
export const useLowStock = (params) => useReportQuery('low-stock', reportsApi.lowStock, params);
export const useSales = (params) => useReportQuery('sales', reportsApi.sales, params);
// booking-api may be down; the dashboard then hides the booking card instead of retrying
export const useBookingSummary = (params) => useReportQuery('booking-summary', reportsApi.bookingSummary, params, { retry: false });
