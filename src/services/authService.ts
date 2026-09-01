import apiClient from './api/apiClient';
import { UserProfile, UserRole } from '../types/auth';
import { useAuthStore } from '../store/useAuthStore';

export interface LoginParams {
  username: string; // Official ID or Email
  password: string;
  role?: UserRole;
}

export interface RegisterParams {
  fullName: string;
  officialId: string;
  email: string;
  department?: string;
  designation?: string;
  phoneNumber?: string;
  password: string;
  role: UserRole;
}

export interface BackendLoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    badge_id?: string;
    checkpoint?: string;
    is_active: boolean;
  };
}

export class AuthService {
  /**
   * Authenticate with FastAPI backend
   */
  static async login(params: LoginParams): Promise<{ user: UserProfile; token: string }> {
    const endpoint = '/api/auth/login';
    if (__DEV__) {
      console.log('[AUTH] Login started');
      console.log('[AUTH] Endpoint:', endpoint);
    }

    try {
      const payload: Record<string, any> = {
        username: params.username.trim(),
        password: params.password,
      };
      if (params.role) {
        payload.role = params.role;
      }

      const response = await apiClient.post<BackendLoginResponse>(endpoint, payload, {
        timeout: 10000, // 10s timeout for auth
      });

      const data = response.data;
      const userProfile: UserProfile = {
        id: data.user.id,
        name: data.user.name || data.user.username,
        username: data.user.username,
        email: data.user.email,
        role: (data.user.role.toUpperCase() as UserRole) || 'OFFICER',
        badgeId: data.user.badge_id || data.user.username,
        checkpoint: data.user.checkpoint || 'Border Checkpoint Alpha',
      };

      // Store in Zustand store (automatically triggers RootNavigator routing)
      useAuthStore.getState().login(userProfile.role, userProfile, data.access_token);

      if (__DEV__) {
        console.log('[AUTH] Status:', response.status);
        console.log('[AUTH] Login successful for role:', userProfile.role);
      }

      return { user: userProfile, token: data.access_token };
    } catch (error: any) {
      if (__DEV__) {
        console.log('[AUTH] Login failed');
        console.log('[AUTH] Status:', error?.response?.status || 'Network Error');
        console.log('[AUTH] Message:', error?.message);
      }
      throw AuthService.formatLoginError(error);
    }
  }

  /**
   * Register a new Investigating Officer or Supervisor account
   */
  static async register(params: RegisterParams): Promise<UserProfile> {
    const endpoint = '/api/auth/register';
    if (__DEV__) {
      console.log('[AUTH] Registration started');
      console.log('[AUTH] Endpoint:', endpoint);
    }

    try {
      const payload = {
        full_name: params.fullName.trim(),
        official_id: params.officialId.trim(),
        email: params.email.trim(),
        department: params.department?.trim() || undefined,
        designation: params.designation?.trim() || undefined,
        phone_number: params.phoneNumber?.trim() || undefined,
        password: params.password,
        role: params.role,
      };

      const response = await apiClient.post(endpoint, payload, {
        timeout: 10000, // 10s timeout for auth
      });

      const data = response.data;
      const userProfile: UserProfile = {
        id: data.id,
        name: data.name || params.fullName,
        username: data.username,
        email: data.email,
        role: (data.role.toUpperCase() as UserRole) || params.role,
        badgeId: data.badge_id || params.officialId,
        checkpoint: data.checkpoint || params.department || 'Main Checkpoint',
        department: params.department,
        designation: params.designation,
        phoneNumber: params.phoneNumber,
      };

      if (__DEV__) {
        console.log('[AUTH] Status:', response.status);
        console.log('[AUTH] Registration successful');
      }

      return userProfile;
    } catch (error: any) {
      const formatted = AuthService.formatRegisterError(error);
      if (__DEV__) {
        console.log('[AUTH] Registration failed');
        console.log('[AUTH] Status:', error?.response?.status || 'Network Error');
        console.log('[AUTH] Message:', formatted.message);
      }
      throw formatted;
    }
  }

  /**
   * Retrieve current user profile from JWT
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/api/auth/me');
      const data = response.data;
      return {
        id: data.id,
        name: data.name || data.username,
        username: data.username,
        email: data.email,
        role: (data.role.toUpperCase() as UserRole) || 'OFFICER',
        badgeId: data.badge_id || data.username,
        checkpoint: data.checkpoint || 'Border Checkpoint Alpha',
      };
    } catch (error: any) {
      throw AuthService.formatLoginError(error);
    }
  }

  /**
   * Formats register error into exact user-facing messages
   */
  private static formatRegisterError(error: any): Error {
    if (!error) {
      return new Error('Unable to connect to PEHCHAAN server. Please check your connection and try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 409) {
        if (typeof detail === 'string') return new Error(detail);
        return new Error('An account with these details already exists.');
      }
      if (status === 400 || status === 422) {
        if (typeof detail === 'string') return new Error(detail);
        if (Array.isArray(detail) && detail[0]?.msg) return new Error(detail[0].msg);
        return new Error('Please check your entered details.');
      }
      if (status === 401 || status === 403) {
        return new Error('Registration is not authorized.');
      }
      if (status >= 500) {
        return new Error('Something went wrong on the server. Please try again.');
      }
    }

    // Network / timeout
    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error')
    ) {
      return new Error('Unable to connect to PEHCHAAN server. Please check your connection and try again.');
    }

    return new Error(error.message || 'Unable to connect to PEHCHAAN server. Please check your connection and try again.');
  }

  /**
   * Formats login error into exact user-facing messages
   */
  private static formatLoginError(error: any): Error {
    if (!error) {
      return new Error('Unable to connect to the server. Please try again.');
    }

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 401) {
        return new Error('Invalid User ID or password.');
      }
      if (status === 403) {
        if (typeof detail === 'string') return new Error(detail);
        return new Error('Invalid User ID or password.');
      }
      if (status >= 500) {
        return new Error('Unable to connect to the server. Please try again.');
      }
      if (typeof detail === 'string') {
        return new Error(detail);
      }
    }

    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Network Error')
    ) {
      return new Error('Unable to connect to the server. Please try again.');
    }

    return new Error(error.message || 'Unable to connect to the server. Please try again.');
  }
}

export default AuthService;
