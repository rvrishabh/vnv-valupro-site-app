import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { AuthUser } from '../../types/auth.types';

const ACCESS_TOKEN_SERVICE = 'vnv_site_access_token';
const REFRESH_TOKEN_SERVICE = 'vnv_site_refresh_token';
const USER_KEY = 'vnv_site_auth_user';
const FALLBACK_KEYS: Record<string, string> = {
  [ACCESS_TOKEN_SERVICE]: 'vnv_site_access_token_fallback',
  [REFRESH_TOKEN_SERVICE]: 'vnv_site_refresh_token_fallback',
};

const isKeychainAvailable = () =>
  typeof Keychain?.getGenericPassword === 'function' &&
  typeof Keychain?.setGenericPassword === 'function' &&
  typeof Keychain?.resetGenericPassword === 'function';

const secureSet = async (service: string, value: string) => {
  const fallbackKey = FALLBACK_KEYS[service];

  if (!isKeychainAvailable()) {
    await AsyncStorage.setItem(fallbackKey, value);
    return;
  }

  try {
    await Keychain.setGenericPassword(service, value, { service });
    await AsyncStorage.removeItem(fallbackKey);
  } catch {
    await AsyncStorage.setItem(fallbackKey, value);
  }
};

const secureGet = async (service: string) => {
  const fallbackKey = FALLBACK_KEYS[service];

  if (!isKeychainAvailable()) {
    return AsyncStorage.getItem(fallbackKey);
  }

  try {
    const credentials = (await Keychain.getGenericPassword({
      service,
    })) as { password?: string };
    if (credentials?.password) {
      return credentials.password;
    }
    return AsyncStorage.getItem(fallbackKey);
  } catch {
    return AsyncStorage.getItem(fallbackKey);
  }
};

const secureReset = async (service: string) => {
  if (isKeychainAvailable()) {
    try {
      await Keychain.resetGenericPassword({ service });
    } catch {
      // no-op and clear fallback below
    }
  }
  await AsyncStorage.removeItem(FALLBACK_KEYS[service]);
};

export const getAccessToken = async () => secureGet(ACCESS_TOKEN_SERVICE);
export const setAccessToken = async (token: string) =>
  secureSet(ACCESS_TOKEN_SERVICE, token);

export const getRefreshToken = async () => secureGet(REFRESH_TOKEN_SERVICE);
export const setRefreshToken = async (token: string) =>
  secureSet(REFRESH_TOKEN_SERVICE, token);

export const setTokens = async (accessToken: string, refreshToken: string) => {
  await Promise.all([setAccessToken(accessToken), setRefreshToken(refreshToken)]);
};

export const getUser = async (): Promise<AuthUser | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
};

export const setUser = async (user: AuthUser) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = async () => {
  await Promise.all([
    secureReset(ACCESS_TOKEN_SERVICE),
    secureReset(REFRESH_TOKEN_SERVICE),
    AsyncStorage.removeItem(USER_KEY),
  ]);
};
