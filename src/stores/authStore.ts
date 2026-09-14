import { useSyncExternalStore } from 'react';
import {
  clearSession,
  getRefreshToken,
  getUser,
  setTokens,
  setUser,
} from '../services/storage/secureAuthStorage';
import { AuthResponse, AuthStatus, AuthUser } from '../types/auth.types';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isHydrated: boolean;
}

type Listener = () => void;

const state: AuthState = {
  status: 'idle',
  user: null,
  isHydrated: false,
};

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(listener => listener());

const setState = (patch: Partial<AuthState>) => {
  Object.assign(state, patch);
  emit();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const authStore = {
  getState: () => state,
  setAuthenticated: async ({ accessToken, refreshToken, user }: AuthResponse) => {
    await Promise.all([setTokens(accessToken, refreshToken), setUser(user)]);
    setState({ status: 'authenticated', user, isHydrated: true });
  },
  /** Stored session kept while the device is offline at launch. */
  markAuthenticatedOffline: () => {
    setState({ status: 'authenticated', isHydrated: true });
  },
  setUser: async (user: AuthUser) => {
    await setUser(user);
    setState({ user });
  },
  setUnauthenticated: async () => {
    await clearSession();
    setState({ status: 'unauthenticated', user: null, isHydrated: true });
  },
  /** Reads the persisted session; the bootstrap then validates it with a refresh. */
  hydrateFromStorage: async () => {
    setState({ status: 'bootstrapping' });
    const [refreshToken, user] = await Promise.all([getRefreshToken(), getUser()]);

    if (refreshToken && user) {
      setState({ status: 'bootstrapping', user, isHydrated: true });
      return;
    }

    setState({ status: 'unauthenticated', user: null, isHydrated: true });
  },
};

export const useAuthStore = <T,>(selector: (s: AuthState) => T) =>
  useSyncExternalStore(subscribe, () => selector(state), () => selector(state));

export const __resetAuthStoreForTests = () => {
  setState({ status: 'idle', user: null, isHydrated: false });
};
