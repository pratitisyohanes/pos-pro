import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

// Guests are sent to login first; admins sell through the cashier screen instead
export const useAddToCart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const add = useCartStore((state) => state.add);

  return (product, quantity = 1) => {
    if (!user) {
      toast('Log in to start an order');
      navigate('/login', { state: { from: location } });
      return;
    }
    if (user.role === 'ADMIN') {
      toast('Admins sell through the cashier screen');
      navigate('/admin/cashier');
      return;
    }
    add(product, quantity);
    toast.success(`${product.name} added to cart`);
  };
};
