import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type AuthUser as ApiAuthUser } from '../lib/api';

export interface AuthUser {
  id: string;
  name: string;
  role: 'student' | 'warden' | 'guard' | 'admin';
  usn?: string | null;
  hostel?: string | null;
  hostelId?: string | null;
  room?: string | null;
  mobile?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  // Actions
  initiateLogin: (identifier: string, password?: string) => Promise<boolean>;
  initiateRegister: (data: { name: string; usn?: string; mobile: string; room?: string; password?: string }) => Promise<boolean>;
  initiateLoginByRole: (role: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      error: null,

      clearError: () => set({ error: null }),

      initiateLogin: async (identifier: string, password?: string) => {
        try {
          set({ error: null });
          const res = await authApi.login(identifier, password || '');
          localStorage.setItem('passmate_token', res.token);
          const user: AuthUser = {
            id: res.user.id,
            name: res.user.name,
            role: res.user.role,
            usn: res.user.usn,
            hostel: res.user.hostel,
            hostelId: res.user.hostelId,
            room: res.user.room,
            mobile: res.user.mobile,
          };
          set({ user, isAuthenticated: true });
          return true;
        } catch (err: any) {
          console.error('Login error:', err);
          set({ error: err.message || 'Login failed' });
          return false;
        }
      },

      initiateRegister: async (data) => {
        try {
          set({ error: null });
          const res = await authApi.register(data);
          localStorage.setItem('passmate_token', res.token);
          const user: AuthUser = {
            id: res.user.id,
            name: res.user.name,
            role: res.user.role,
            usn: res.user.usn,
            hostel: res.user.hostel,
            hostelId: res.user.hostelId,
            room: res.user.room,
            mobile: res.user.mobile,
          };
          set({ user, isAuthenticated: true });
          return true;
        } catch (err: any) {
          console.error('Register error:', err);
          set({ error: err.message || 'Registration failed' });
          return false;
        }
      },

      initiateLoginByRole: async (role: string) => {
        try {
          const res = await authApi.loginByRole(role);
          localStorage.setItem('passmate_token', res.token);
          const user: AuthUser = {
            id: res.user.id,
            name: res.user.name,
            role: res.user.role,
            usn: res.user.usn,
            hostel: res.user.hostel,
            hostelId: res.user.hostelId,
            room: res.user.room,
            mobile: res.user.mobile,
          };
          set({ user, isAuthenticated: true });
          return true;
        } catch (err) {
          console.error('Login by role error:', err);
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('passmate_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'passmate-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export type { ApiAuthUser };
