import { create } from 'zustand';
import { AuthState, UserRole, UserProfile } from '../types/auth';

export const useAuthStore = create<AuthState>((set) => ({
  role: 'OFFICER',
  isLoggedIn: false,
  user: null,
  token: null,
  setRole: (role: UserRole) => set({ role }),
  login: (role: UserRole, user: UserProfile, token?: string) =>
    set({
      isLoggedIn: true,
      role,
      user,
      token: token || null,
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      role: 'OFFICER',
      user: null,
      token: null,
    }),
}));
