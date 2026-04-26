// authService.ts — Firebase Phone OTP authentication (real SMS, no mocks)
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged,
  type ConfirmationResult,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'student' | 'parent' | 'warden' | 'guard' | 'admin';

export interface AppUser {
  uid: string;
  phone: string;
  role: UserRole;
  name?: string;
  usn?: string;
  room?: string;
  hostel?: string;
  createdAt?: Date;
  /** true when the user has completed their profile (name + room) */
  profileComplete?: boolean;
}

// Module-level singleton — one verifier per page lifetime
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize invisible reCAPTCHA on the DOM element with id = containerId.
 * Safe to call multiple times — clears the previous instance first.
 * Call this in useEffect on component mount.
 */
export function initRecaptcha(containerId: string): void {
  cleanupRecaptcha();
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved — sendOtp will proceed
    },
    'expired-callback': () => {
      cleanupRecaptcha();
    },
  });
  // Render eagerly so it's ready when the user clicks Send OTP
  recaptchaVerifier.render().catch(() => {
    // May fail in SSR/jsdom — safe to ignore
  });
}

/**
 * Tear down and nullify the reCAPTCHA verifier.
 * Call this in useEffect cleanup (return of useEffect).
 */
export function cleanupRecaptcha(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (_) {
      // Already cleared — ignore
    }
    recaptchaVerifier = null;
  }
}

/**
 * Send a real OTP SMS via Firebase Phone Auth.
 * Ensures E.164 format (+91XXXXXXXXXX for India).
 */
export async function sendOTP(rawPhone: string): Promise<ConfirmationResult> {
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized. Please refresh and try again.');
  }

  // Strip non-digits, then prepend country code if missing
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 10) throw new Error('Enter a valid 10-digit mobile number.');

  const e164 = digits.startsWith('91') && digits.length === 12
    ? `+${digits}`
    : `+91${digits.slice(-10)}`;

  try {
    return await signInWithPhoneNumber(auth, e164, recaptchaVerifier);
  } catch (err: any) {
    // reCAPTCHA is consumed after one attempt — must reinitialize
    cleanupRecaptcha();
    throw mapFirebaseError(err);
  }
}

/**
 * Verify the OTP entered by the user.
 * On success → upserts Firestore user profile and returns AppUser.
 */
export async function verifyOTP(
  confirmationResult: ConfirmationResult,
  code: string,
  role: UserRole,
  extra?: { name?: string; usn?: string; room?: string; hostel?: string }
): Promise<AppUser> {
  let cred;
  try {
    cred = await confirmationResult.confirm(code.trim());
  } catch (err: any) {
    throw mapFirebaseError(err);
  }

  const fbUser = cred.user;
  const uid   = fbUser.uid;
  const phone = fbUser.phoneNumber ?? '';

  // Upsert Firestore profile — preserve existing role/data on re-login
  const userRef = doc(db, 'users', uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    // Brand-new user — write minimal profile, mark incomplete
    const newProfile = {
      uid,
      phone,
      role,
      ...extra,
      profileComplete: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, newProfile);
    return { uid, phone, role, ...extra, profileComplete: false, createdAt: new Date() };
  }

  // Existing user — return stored profile (don't overwrite role)
  const data = snap.data();
  return { uid, phone, ...data, profileComplete: data.profileComplete ?? !!data.name } as AppUser;
}

/**
 * Fetch a Firestore user profile by uid.
 */
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { uid, ...data, profileComplete: data.profileComplete ?? !!data.name } as AppUser;
}

/**
 * Save completed profile data for a user (called from CompleteProfilePage).
 * Marks profileComplete = true so the app stops redirecting to /complete-profile.
 */
export async function saveUserProfile(
  uid: string,
  data: { name: string; room: string; hostel?: string; usn?: string }
): Promise<AppUser> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User document not found.');

  const updateData = {
    ...data,
    profileComplete: true,
  };
  await setDoc(userRef, updateData, { merge: true });

  const updated = { ...snap.data(), ...updateData };
  return { uid, ...updated } as AppUser;
}

/**
 * Firebase sign-out + reCAPTCHA cleanup.
 */
export async function logoutUser(): Promise<void> {
  cleanupRecaptcha();
  await signOut(auth);
}

/**
 * Subscribe to Firebase auth state changes. Returns unsubscribe function.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ─── Error mapping ────────────────────────────────────────────────────────────

function mapFirebaseError(err: any): Error {
  const code: string = err?.code ?? '';
  const messages: Record<string, string> = {
    'auth/invalid-phone-number':        'Invalid phone number. Use format: 10-digit mobile.',
    'auth/too-many-requests':           'Too many attempts. Please wait a few minutes and try again.',
    'auth/quota-exceeded':              'SMS quota exceeded. Try again later or contact support.',
    'auth/invalid-verification-code':   'Incorrect OTP. Please check and try again.',
    'auth/code-expired':                'OTP has expired. Please request a new one.',
    'auth/session-expired':             'Session expired. Please resend OTP.',
    'auth/missing-phone-number':        'Phone number is required.',
    'auth/captcha-check-failed':        'reCAPTCHA verification failed. Please refresh and try again.',
    'auth/network-request-failed':      'Network error. Check your internet connection.',
    'auth/user-disabled':               'This account has been disabled. Contact administrator.',
  };
  return new Error(messages[code] ?? err?.message ?? 'Authentication failed. Please try again.');
}

export { auth };
