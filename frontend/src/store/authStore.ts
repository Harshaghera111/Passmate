// authStore.ts — Zustand store backed by Firebase Auth + Firestore
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConfirmationResult } from 'firebase/auth';
import {
  initRecaptcha, cleanupRecaptcha,
  sendOTP, verifyOTP, logoutUser,
  onAuthChange, fetchUserProfile,
  type AppUser, type UserRole,
} from '../services/authService';

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  error: string | null;

  // OTP flow state
  confirmationResult: ConfirmationResult | null;
  otpSent: boolean;
  otpLoading: boolean;

  // Actions
  setupRecaptcha: (containerId: string) => void;
  teardownRecaptcha: () => void;
  resetOtpState: () => void;
  sendOtpCode: (phone: string, role: UserRole) => Promise<boolean>;
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

      setupRecaptcha: (containerId: string) => {
        initRecaptcha(containerId);
      },

      teardownRecaptcha: () => {
        cleanupRecaptcha();
      },

      resetOtpState: () => {
        set({ otpSent: false, confirmationResult: null, error: null });
      },

      sendOtpCode: async (phone: string, _role: UserRole) => {
        set({ otpLoading: true, error: null });
        try {
          const confirmation = await sendOTP(phone);
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
          set({ error: 'Session expired. Please resend OTP.' });
          return false;
        }
        set({ otpLoading: true, error: null });
        try {
          const user = await verifyOTP(confirmationResult, code, role, extra);
          set({
            user,
            isAuthenticated: true,
            otpLoading: false,
            otpSent: false,
            confirmationResult: null,
            error: null,
          });
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Invalid OTP', otpLoading: false });
          return false;
        }
      },

      logout: async () => {
        await logoutUser();
        set({ user: null, isAuthenticated: false, otpSent: false, confirmationResult: null, error: null });
      },

      initAuthListener: () => {
        return onAuthChange(async (fbUser) => {
          if (fbUser) {
            const profile = await fetchUserProfile(fbUser.uid);
            if (profile) set({ user: profile, isAuthenticated: true });
          } else {
            // Only clear if we were authenticated (avoids race on initial load)
            const { isAuthenticated } = get();
            if (isAuthenticated) set({ user: null, isAuthenticated: false });
          }
        });
      },
    }),
    {
      name: 'passmate-auth-v2',
      // ConfirmationResult is not JSON-serializable — exclude it
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type { AppUser as AuthUser };
