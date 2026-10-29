import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    const { refreshToken, clearSession } = useAuthStore.getState();
    // Local logout must still work when the server call fails
    await authApi.logout(refreshToken).catch(() => null);
    clearSession();
    useCartStore.getState().clear();
    queryClient.clear();
    toast.success('You have been logged out');
    navigate('/login');
  };
};
