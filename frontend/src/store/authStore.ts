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
  // OTP flow state
  pendingUserId: string | null;
  pendingMaskedMobile: string | null;
  devOtp: string | null;
  // Actions
  initiateLogin: (usn: string, mobile: string) => Promise<boolean>;
  initiateLoginByRole: (role: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  // Legacy mock login (kept for dev fallback)
  login: (role: AuthUser['role']) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      pendingUserId: null,
      pendingMaskedMobile: null,
      devOtp: null,

      initiateLogin: async (usn: string, mobile: string) => {
        try {
          const res = await authApi.login(usn, mobile);
          set({ pendingUserId: res.userId, pendingMaskedMobile: res.maskedMobile, devOtp: res.devOtp || null });
          return true;
        } catch (err) {
          console.error('Login error:', err);
          return false;
        }
      },

      initiateLoginByRole: async (role: string) => {
        try {
          const res = await authApi.loginByRole(role);
          set({ pendingUserId: res.userId, pendingMaskedMobile: res.maskedMobile, devOtp: res.devOtp || null });
          return true;
        } catch (err) {
          console.error('Login by role error:', err);
          return false;
        }
      },

      verifyOtp: async (otp: string) => {
        const { pendingUserId } = get();
        if (!pendingUserId) return false;
        try {
          const res = await authApi.verifyOtp(pendingUserId, otp);
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
          set({ user, isAuthenticated: true, pendingUserId: null, pendingMaskedMobile: null, devOtp: null });
          return true;
        } catch (err) {
          console.error('OTP verify error:', err);
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('passmate_token');
        set({ user: null, isAuthenticated: false, pendingUserId: null, pendingMaskedMobile: null, devOtp: null });
      },

      // Legacy demo login (direct bypass without OTP)
      login: (role: AuthUser['role']) => {
        const DEMO_USERS: Record<string, AuthUser> = {
          student: { id: 's1', name: 'Harsh Verma', role: 'student', usn: '1DS22CS042', hostel: 'Cauvery Boys Hostel', hostelId: 'h1', room: 'A-204', mobile: '9845012345' },
          warden: { id: 'w1', name: 'Dr. Ramesh Kumar', role: 'warden', hostel: 'Cauvery Boys Hostel', hostelId: 'h1', mobile: '9845001234' },
          guard: { id: 'g1', name: 'Suresh Babu', role: 'guard', mobile: '9900012345' },
          admin: { id: 'a1', name: 'System Admin', role: 'admin', mobile: '9000000001' },
        };
        set({ user: DEMO_USERS[role] || null, isAuthenticated: true });
      },
    }),
    {
      name: 'passmate-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export type { ApiAuthUser };
