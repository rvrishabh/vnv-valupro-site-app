import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import Config from 'react-native-config';
import { AuthResponse } from '../../types/auth.types';
import { ApiEnvelope, ApiErrorEnvelope } from '../../types/common.types';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  setTokens,
  setUser,
} from '../storage/secureAuthStorage';

const BASE_URL = Config.API_BASE_URL;

let onAuthFailureHandler: (() => void) | null = null;
let refreshPromise: Promise<string> | null = null;

type RetriableRequest = AxiosRequestConfig & {
  _retry?: boolean;
};

export const authlessClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export const setOnAuthFailure = (handler: (() => void) | null) => {
  onAuthFailureHandler = handler;
};

/**
 * The backend reports failures as `{ success: false, error, statusCode }`, where
 * `error` is an array of messages when class-validator rejects a body.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
): string => {
  const axiosError = error as AxiosError<ApiErrorEnvelope>;
  if (axiosError?.isAxiosError && !axiosError.response) {
    return 'Network error. Please check your connection.';
  }
  const apiError = axiosError?.response?.data?.error;
  if (Array.isArray(apiError)) {
    return apiError.join('\n');
  }
  if (typeof apiError === 'string' && apiError) {
    return apiError;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

/**
 * Mobile refresh sends the refresh token in the body (the web portal uses a
 * cookie). The backend re-checks that the account is still active/approved,
 * so a deactivated engineer is signed out on their next refresh.
 */
export const refreshSession = async (): Promise<AuthResponse> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh session');
  }

  const { data } = await authlessClient.post<ApiEnvelope<AuthResponse>>(
    '/auth/refresh',
    { refreshToken },
  );

  const session = data?.data;
  if (!session?.accessToken || !session?.refreshToken) {
    throw new Error('Invalid refresh response');
  }

  await Promise.all([
    setTokens(session.accessToken, session.refreshToken),
    setUser(session.user),
  ]);

  return session;
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Default Content-Type is application/json. For FormData uploads that forces
    // a broken body — let RN set multipart + boundary itself.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      const headers = config.headers as {
        delete?: (name: string) => void;
        ['Content-Type']?: string;
      };
      if (typeof headers?.delete === 'function') {
        headers.delete('Content-Type');
      } else if (headers) {
        delete headers['Content-Type'];
      }
    }

    return config;
  },
  error => Promise.reject(error),
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequest;

    if (!error.response || error.response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Single in-flight refresh shared by every request that hit a 401.
      if (!refreshPromise) {
        refreshPromise = refreshSession()
          .then(session => session.accessToken)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const nextAccessToken = await refreshPromise;
      originalRequest.headers = {
        ...(originalRequest.headers ?? {}),
        Authorization: `Bearer ${nextAccessToken}`,
      };
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearSession();
      onAuthFailureHandler?.();
      return Promise.reject(refreshError);
    }
  },
);

export const __resetClientInterceptorsForTests = () => {
  refreshPromise = null;
  onAuthFailureHandler = null;
};
