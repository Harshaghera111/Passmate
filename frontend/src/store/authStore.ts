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
  authLoading: boolean;  // true until Firebase Auth resolves for the first time
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
      authLoading: true,   // remains true until onAuthStateChanged fires once
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
          console.log('[Auth] onAuthStateChanged fired. fbUser:', fbUser?.uid ?? null);
          if (fbUser) {
            try {
              const profile = await fetchUserProfile(fbUser.uid);
              if (profile) {
                console.log('[Auth] Profile loaded:', profile.role);
                set({ user: profile, isAuthenticated: true, authLoading: false });
              } else {
                // Firestore profile missing — sign out gracefully
                console.warn('[Auth] No Firestore profile found for uid:', fbUser.uid);
                set({ user: null, isAuthenticated: false, authLoading: false });
              }
            } catch (err) {
              console.error('[Auth] Failed to fetch profile:', err);
              set({ user: null, isAuthenticated: false, authLoading: false });
            }
          } else {
            console.log('[Auth] No user signed in.');
            set({ user: null, isAuthenticated: false, authLoading: false });
          }
        });
      },
    }),
    {
      name: 'passmate-auth-v2',
      // ConfirmationResult is not JSON-serializable — exclude it.
      // authLoading must NOT be persisted — it should always start true
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export type { AppUser as AuthUser };
