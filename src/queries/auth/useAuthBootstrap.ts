import { useEffect } from 'react';
import { refreshSession } from '../../services/api/client';
import { authStore } from '../../stores/authStore';

/**
 * There is no /me endpoint for mobile users, so a stored session is validated
 * by refreshing it: that both renews the 15-minute access token and re-checks
 * on the server that the engineer is still active and approved.
 */
export const bootstrapAuthSession = async () => {
  await authStore.hydrateFromStorage();
  const currentState = authStore.getState();

  if (!currentState.user) {
    await authStore.setUnauthenticated();
    return;
  }

  try {
    const session = await refreshSession();
    await authStore.setAuthenticated(session);
  } catch (error) {
    // Offline at launch: keep the stored session rather than signing the
    // engineer out in the field; the interceptor retries the refresh on the
    // first request that gets a 401.
    const isNetworkError =
      (error as { isAxiosError?: boolean; response?: unknown })?.isAxiosError &&
      !(error as { response?: unknown }).response;
    if (isNetworkError) {
      await authStore.setUser(currentState.user);
      authStore.markAuthenticatedOffline();
      return;
    }
    await authStore.setUnauthenticated();
  }
};

export const useAuthBootstrap = () => {
  useEffect(() => {
    bootstrapAuthSession();
  }, []);
};
