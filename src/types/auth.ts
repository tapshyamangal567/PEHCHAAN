export type UserRole = 'OFFICER' | 'SUPERVISOR';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  badgeId: string;
  checkpoint: string;
  avatarUrl?: string;
  email?: string;
}

export interface AuthState {
  role: UserRole;
  isLoggedIn: boolean;
  user: UserProfile | null;
  setRole: (role: UserRole) => void;
  login: (role: UserRole, user: UserProfile) => void;
  logout: () => void;
}
