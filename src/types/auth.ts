export type UserRole = 'OFFICER' | 'SUPERVISOR' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  badgeId: string;
  checkpoint: string;
  email?: string;
  department?: string;
  designation?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export interface AuthState {
  role: UserRole;
  isLoggedIn: boolean;
  user: UserProfile | null;
  token: string | null;
  setRole: (role: UserRole) => void;
  login: (role: UserRole, user: UserProfile, token?: string) => void;
  logout: () => void;
}
