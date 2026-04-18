// authService.ts — Firebase Phone OTP authentication
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
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Setup invisible reCAPTCHA on the container element with given id.
 * Must be called before sendOtp(). Safe to call multiple times.
 */
export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  // Clear old instance if exists
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_) {}
    recaptchaVerifier = null;
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return recaptchaVerifier;
}

/**
 * Send OTP to phone number (+91XXXXXXXXXX format).
 * Returns ConfirmationResult used to verify the OTP.
 */
export async function sendOtp(phone: string): Promise<ConfirmationResult> {
  if (!recaptchaVerifier) throw new Error('Call setupRecaptcha() first');
  // Ensure E.164 format
  const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
  return signInWithPhoneNumber(auth, formatted, recaptchaVerifier);
}

/**
 * Confirm OTP code. Returns AppUser after upserting Firestore profile.
 */
export async function verifyOtp(
  confirmation: ConfirmationResult,
  code: string,
  role: UserRole,
  extra?: { name?: string; usn?: string; room?: string; hostel?: string }
): Promise<AppUser> {
  const cred = await confirmation.confirm(code);
  const fbUser = cred.user;
  const uid = fbUser.uid;
  const phone = fbUser.phoneNumber || '';

  // Upsert Firestore profile — merge keeps existing fields
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  const profile: AppUser = snap.exists()
    ? { uid, phone, ...(snap.data() as Omit<AppUser, 'uid' | 'phone'>) }
    : { uid, phone, role, ...extra, createdAt: new Date() };

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      phone,
      role,
      ...extra,
      createdAt: serverTimestamp(),
    });
  }

  return profile;
}

/**
 * Fetch user profile from Firestore by uid.
 */
export async function fetchUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as AppUser;
}

/**
 * Sign out current Firebase user.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (_) {}
    recaptchaVerifier = null;
  }
}

/**
 * Subscribe to auth state changes. Returns unsubscribe fn.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

export { auth };
