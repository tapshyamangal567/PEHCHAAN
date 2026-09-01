import axios from 'axios';
import { API_CONFIG } from './config';
import { useAuthStore } from '../../store/useAuthStore';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor for secure auth headers
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
      console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    }
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.log('[API Request Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for security API errors
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API Response] HTTP ${response.status} from ${response.config.baseURL || ''}${response.config.url || ''}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      const status = error.response?.status;
      const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
      console.log(`[API Response Error] HTTP ${status || error.code || 'Network Error'} from ${url}`);
      if (error.response?.data) {
        console.log('[API Error Data]:', JSON.stringify(error.response.data));
      }
    }
    if (error.response?.status === 401) {
      // If unauthorized on protected endpoint (and not login endpoint), logout
      const url = error.config?.url || '';
      if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
