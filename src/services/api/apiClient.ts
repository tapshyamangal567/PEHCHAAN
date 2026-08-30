import axios from 'axios';
import { API_CONFIG } from './config';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor for secure auth headers
apiClient.interceptors.request.use(
  (config) => {
    // Environment token or session bearer setup
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for security API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
