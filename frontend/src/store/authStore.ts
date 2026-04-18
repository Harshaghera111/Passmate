// authStore.ts — Zustand store backed by Firebase Auth + Firestore
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfirmationResult } from 'firebase/auth';
import {
  setupRecaptcha, sendOtp, verifyOtp, logoutUser,
  onAuthChange, fetchUserProfile,
  type AppUser, type UserRole,
} from '../services/authService';

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  error: string | null;

  // OTP flow
  confirmationResult: ConfirmationResult | null;
  otpSent: boolean;
  otpLoading: boolean;

  // Actions
  initRecaptcha: (containerId: string) => void;
  sendOtpCode: (phone: string) => Promise<boolean>;
  confirmOtpCode: (code: string, role: UserRole, extra?: { name?: string; usn?: string; room?: string; hostel?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: AppUser | null) => void;
  clearError: () => void;
  initAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      error: null,
      confirmationResult: null,
      otpSent: false,
      otpLoading: false,

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      initRecaptcha: (containerId: string) => {
        setupRecaptcha(containerId);
      },

      sendOtpCode: async (phone: string) => {
        set({ otpLoading: true, error: null });
        try {
          const confirmation = await sendOtp(phone);
          set({ confirmationResult: confirmation, otpSent: true, otpLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Failed to send OTP', otpLoading: false });
          return false;
        }
      },

      confirmOtpCode: async (code, role, extra) => {
        const { confirmationResult } = get();
        if (!confirmationResult) {
          set({ error: 'No OTP session. Please resend.' });
          return false;
        }
        set({ otpLoading: true, error: null });
        try {
          const user = await verifyOtp(confirmationResult, code, role, extra);
          set({ user, isAuthenticated: true, otpLoading: false, otpSent: false, confirmationResult: null });
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Invalid OTP', otpLoading: false });
          return false;
        }
      },

      logout: async () => {
        await logoutUser();
        set({ user: null, isAuthenticated: false, otpSent: false, confirmationResult: null });
      },

      initAuthListener: () => {
        return onAuthChange(async (fbUser) => {
          if (fbUser) {
            const profile = await fetchUserProfile(fbUser.uid);
            if (profile) set({ user: profile, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        });
      },
    }),
    {
      name: 'passmate-auth-v2',
      // Don't persist confirmationResult (not serializable)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Re-export for backward compat with pages that import AuthUser type
export type { AppUser as AuthUser };
