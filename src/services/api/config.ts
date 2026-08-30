import { API_BASE_URL } from '../../config/api';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 120000, // 120 seconds timeout for EasyOCR processing
  headers: {
    'X-Client-App': 'PEHCHAAN-Mobile-Security',
    'X-App-Version': '1.0.0',
  },
};
