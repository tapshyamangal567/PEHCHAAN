import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  // 1. Explicit environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    const url = process.env.EXPO_PUBLIC_API_URL;
    if (__DEV__) {
      console.log('[API] Base URL from EXPO_PUBLIC_API_URL:', url);
    }
    return url;
  }

  // 2. Web browser: auto-detect current hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = 'http://127.0.0.1:8000';
      if (__DEV__) console.log('[API] Base URL for web localhost:', url);
      return url;
    }
    const url = `http://${hostname}:8000`;
    if (__DEV__) console.log('[API] Base URL for web network:', url);
    return url;
  }

  // 3. Fallback to active development IP
  const defaultUrl = 'http://10.68.42.91:8000';
  if (__DEV__) {
    console.log('[API] Base URL fallback:', defaultUrl);
  }
  return defaultUrl;
};

export const API_BASE_URL = getBaseUrl();
