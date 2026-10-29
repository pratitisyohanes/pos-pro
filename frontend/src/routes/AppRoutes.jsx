import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import { PageLoader } from '../components/ui/Spinner';
import HomePage from '../pages/public/HomePage';
import ProductsPage from '../pages/public/ProductsPage';
import ProductDetailPage from '../pages/public/ProductDetailPage';
import LoginPage from '../pages/public/LoginPage';
import { ForbiddenPage, NotFoundPage } from '../pages/public/StatusPages';
import CartPage from '../pages/user/CartPage';
import MyOrdersPage from '../pages/user/MyOrdersPage';
import OrderDetailPage from '../pages/user/OrderDetailPage';

// Admin pages are split into a separate bundle because customers never need them
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const CashierPage = lazy(() => import('../pages/admin/CashierPage'));
const SalesPage = lazy(() => import('../pages/admin/SalesPage'));
const SaleDetailPage = lazy(() => import('../pages/admin/SaleDetailPage'));
const AdminProductsPage = lazy(() => import('../pages/admin/ProductsPage'));
const CategoriesPage = lazy(() => import('../pages/admin/CategoriesPage'));
const StockPage = lazy(() => import('../pages/admin/StockPage'));
const ReportsPage = lazy(() => import('../pages/admin/ReportsPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />

          <Route element={<GuestRoute />}>
            <Route path="login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['USER']} />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
            <Route path="my-orders/:id" element={<OrderDetailPage />} />
          </Route>

          <Route path="forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="cashier" element={<CashierPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="sales/:id" element={<SaleDetailPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
