import { useEffect, useState } from 'react';
import { refreshSession } from '../api/client';
import { useAuthStore } from '../store/authStore';

// After a reload only the refresh token is stored, so get a new access token before rendering
export const useSessionBootstrap = () => {
  const [isReady, setIsReady] = useState(() => {
    const { refreshToken, accessToken } = useAuthStore.getState();
    return !refreshToken || !!accessToken;
  });

  useEffect(() => {
    if (isReady) return;
    refreshSession()
      .catch(() => useAuthStore.getState().clearSession())
      .finally(() => setIsReady(true));
  }, [isReady]);

  return isReady;
};
