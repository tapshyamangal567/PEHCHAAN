import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the backend API base URL with priority:
 * 1. Explicit EXPO_PUBLIC_API_URL environment variable (HIGHEST PRIORITY)
 * 2. Web browser: auto-detect current hostname on port 8001
 * 3. Dynamic Expo Metro connection: automatically extracts computer IP from Metro Bundler
 * 4. Android Emulator: 10.0.2.2:8001
 * 5. Fallback: http://localhost:8001
 */
const getBaseUrl = (): string => {
  // 1. Explicit EXPO_PUBLIC_API_URL environment variable (HIGHEST PRIORITY)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    if (__DEV__) {
      console.log('[API Config] Using EXPO_PUBLIC_API_URL from environment:', cleanUrl);
    }
    return cleanUrl;
  }

  // 2. Web browser: auto-detect current hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = 'http://127.0.0.1:8001';
      if (__DEV__) console.log('[API Config] Web localhost detected:', url);
      return url;
    }
    const url = `http://${hostname}:8001`;
    if (__DEV__) console.log('[API Config] Web network host detected:', url);
    return url;
  }

  // 3. Dynamic Expo host detection (extracts development PC IP from Metro connection)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      const url = `http://${host}:8001`;
      if (__DEV__) {
        console.log('[API Config] Auto-detected Metro host IP:', url);
      }
      return url;
    }
  }

  // 4. Android Emulator default
  if (Platform.OS === 'android' && !Constants.isDevice) {
    const url = 'http://10.0.2.2:8001';
    if (__DEV__) console.log('[API Config] Android Emulator host:', url);
    return url;
  }

  // 5. Default fallback
  const defaultUrl = 'http://localhost:8001';
  if (__DEV__) {
    console.log('[API Config] Fallback default:', defaultUrl);
  }
  return defaultUrl;
};

export const API_BASE_URL = getBaseUrl();

if (__DEV__) {
  console.log('[API Config] FINAL API_BASE_URL:', API_BASE_URL);
}
