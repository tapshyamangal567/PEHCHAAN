import { create } from 'zustand';
import { AuthState, UserRole, UserProfile } from '../types/auth';

export const MOCK_OFFICER_USER: UserProfile = {
  id: 'OFF-8842',
  name: 'Arjun Mehta',
  role: 'OFFICER',
  badgeId: 'IND-SEC-8842',
  checkpoint: 'Checkpoint Alpha',
  email: 'arjun.mehta@border.pehchaan.gov.in',
};

export const MOCK_SUPERVISOR_USER: UserProfile = {
  id: 'SUP-1090',
  name: 'Priya Sharma',
  role: 'SUPERVISOR',
  badgeId: 'IND-SUP-1090',
  checkpoint: 'Checkpoint Alpha',
  email: 'priya.sharma@border.pehchaan.gov.in',
};

export const useAuthStore = create<AuthState>((set) => ({
  role: 'OFFICER',
  isLoggedIn: false,
  user: null,
  setRole: (role: UserRole) => set({ role }),
  login: (role: UserRole, user: UserProfile) =>
    set({
      isLoggedIn: true,
      role,
      user,
    }),
  logout: () =>
    set({
      isLoggedIn: false,
      role: 'OFFICER',
      user: null,
    }),
}));
