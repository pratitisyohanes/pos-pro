import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// The login page is only for visitors who are not logged in
export default function GuestRoute() {
  const user = useAuthStore((state) => state.user);
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin/cashier' : '/products'} replace />;
  return <Outlet />;
}
