import { create } from 'zustand';
import { AuthState, UserRole, UserProfile } from '../types/auth';

export const MOCK_OFFICER_USER: UserProfile = {
  id: 'OFF-8842',
  name: 'Arjun Mehta',
  username: 'OFF-8842',
  role: 'OFFICER',
  badgeId: 'IND-SEC-8842',
  checkpoint: 'Checkpoint Alpha',
  email: 'arjun.mehta@border.pehchaan.gov.in',
  department: 'Immigration & Border Control Unit',
  designation: 'Senior Investigating Officer',
  phoneNumber: '+91 98765 43210',
};

export const MOCK_SUPERVISOR_USER: UserProfile = {
  id: 'SUP-1090',
  name: 'Priya Sharma',
  username: 'SUP-1090',
  role: 'SUPERVISOR',
  badgeId: 'IND-SUP-1090',
  checkpoint: 'Checkpoint Alpha',
  email: 'priya.sharma@border.pehchaan.gov.in',
  department: 'Border Security Oversight Command',
  designation: 'Chief Security Supervisor',
  phoneNumber: '+91 98765 43211',
};

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
