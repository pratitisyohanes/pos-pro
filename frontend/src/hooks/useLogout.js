import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { isSsoEnabled, ssoLogoutUrl } from '../utils/oidc';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    const { refreshToken, clearSession } = useAuthStore.getState();

    // Single sign-on: end the KandangID session too, which comes back to this app's home page
    if (isSsoEnabled) {
      clearSession();
      useCartStore.getState().clear();
      queryClient.clear();
      window.location.assign(ssoLogoutUrl());
      return;
    }

    // Local logout must still work when the server call fails
    await authApi.logout(refreshToken).catch(() => null);
    clearSession();
    useCartStore.getState().clear();
    queryClient.clear();
    toast.success('You have been logged out');
    navigate('/login');
  };
};
