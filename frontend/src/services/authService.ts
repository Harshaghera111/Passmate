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

export interface RoleProfile {
  role: UserRole;
  name?: string;
  usn?: string;
  room?: string;
  hostel?: string;
  profileComplete: boolean;
}

export interface AppUser {
  uid: string;
  phone: string;
  role: UserRole;
  isDemo?: boolean;
  name?: string;
  usn?: string;
  room?: string;
  hostel?: string;
  createdAt?: Date;
  /** true when the user has completed their profile (name + room) */
  profileComplete?: boolean;
}

/**
 * Canonical whitelist of authorized demo phone numbers.
 *
 * CRITICAL SYNC & SECURITY REQUIREMENT:
 * Any phone number listed here MUST also be explicitly declared in firestore.rules
 * under `isDemoCaller()` in E.164 format (e.g. '+917620981982').
 * Frontend environment variables alone CANNOT grant demo privileges in Firestore.
 */
export const DEMO_PHONES = [
  '7620981982', // Demo test phone (+917620981982)
  '9845012345', // Seed Student (+919845012345)
  '9845001234', // Seed Warden (+919845001234)
  '9900012345', // Seed Guard (+919900012345)
  '9000000001', // Seed Admin (+919000000001)
];

/** Check if a given phone number is an authorized demo account */
export function isDemoPhone(rawPhone: string): boolean {
  const digits = rawPhone.replace(/\D/g, '').slice(-10);
  return DEMO_PHONES.includes(digits);
}

/** Pre-seeded demo role profiles — Student, Warden, Guard share Cauvery Boys Hostel */
export const DEFAULT_DEMO_PROFILES: Record<UserRole, RoleProfile> = {
  student: {
    role: 'student',
    name: 'Harsh Verma',
    usn: '1DS22CS042',
    room: 'A-204',
    hostel: 'Cauvery Boys Hostel',
    profileComplete: true,
  },
  warden: {
    role: 'warden',
    name: 'Dr. Ramesh Kumar',
    hostel: 'Cauvery Boys Hostel',
    profileComplete: true,
  },
  guard: {
    role: 'guard',
    name: 'Suresh Babu',
    hostel: 'Cauvery Boys Hostel',
    profileComplete: true,
  },
  admin: {
    role: 'admin',
    name: 'System Admin',
    profileComplete: true,
  },
  parent: {
    role: 'parent',
    name: 'Ramesh Verma (Parent)',
    hostel: 'Cauvery Boys Hostel',
    profileComplete: true,
  },
};

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

  const userRef = doc(db, 'users', uid);
  const snap    = await getDoc(userRef);
  const isDemo  = isDemoPhone(phone);

  if (isDemo) {
    // ── DEMO / DEVELOPMENT ACCOUNT FLOW ───────────────────────────────────────
    // Preserve existing role profiles in a vault so switching roles is seamless
    const existingData = snap.exists() ? snap.data() : null;
    const roleProfiles: Record<string, RoleProfile> = existingData?.roleProfiles || {};

    // Ensure all default role profiles are seeded
    for (const r of ['student', 'warden', 'guard', 'admin', 'parent'] as UserRole[]) {
      if (!roleProfiles[r]) {
        roleProfiles[r] = { ...DEFAULT_DEMO_PROFILES[r] };
      }
    }

    // Merge any user-provided extra fields (e.g. name on initial screen)
    if (extra?.name && role === 'student') {
      roleProfiles.student.name = extra.name;
    }

    // Activate the requested role profile
    const activeProfile = roleProfiles[role] || DEFAULT_DEMO_PROFILES[role];

    const updatedDoc: Record<string, any> = {
      uid,
      phone,
      isDemo: true,
      role,
      name: activeProfile.name || '',
      usn: activeProfile.usn || null,
      room: activeProfile.room || null,
      hostel: activeProfile.hostel || null,
      profileComplete: activeProfile.profileComplete ?? true,
      roleProfiles,
      updatedAt: serverTimestamp(),
      ...(snap.exists() ? {} : { createdAt: serverTimestamp() }),
    };

    await setDoc(userRef, updatedDoc, { merge: true });

    return {
      uid,
      phone,
      role,
      isDemo: true,
      name: activeProfile.name,
      usn: activeProfile.usn,
      room: activeProfile.room,
      hostel: activeProfile.hostel,
      profileComplete: activeProfile.profileComplete,
      createdAt: existingData?.createdAt?.toDate ? existingData.createdAt.toDate() : new Date(),
    } as AppUser;
  }

  // ── PRODUCTION ACCOUNT FLOW ───────────────────────────────────────────────
  if (!snap.exists()) {
    // Brand-new production user:
    // Security check: Production users cannot self-register as warden, guard, or admin
    if (['warden', 'guard', 'admin'].includes(role)) {
      await signOut(auth);
      throw new Error(`Self-registration is not permitted for the ${role.toUpperCase()} role.`);
    }

    const newProfile = {
      uid,
      phone,
      role,
      isDemo: false,
      ...extra,
      profileComplete: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, newProfile);
    return { uid, phone, role, isDemo: false, ...extra, profileComplete: false, createdAt: new Date() };
  }

  // Existing production user:
  const data = snap.data();
  const registeredRole = data.role as UserRole;

  // Security check: Prevent privilege escalation or unauthorized role selection
  if (registeredRole !== role) {
    await signOut(auth);
    throw new Error(
      `Access denied: This account is registered as ${registeredRole.toUpperCase()}. You cannot log in as ${role.toUpperCase()}.`
    );
  }

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
 * Also keeps the role profile vault synchronized for demo accounts.
 */
export async function saveUserProfile(
  uid: string,
  data: { name: string; room: string; hostel?: string; usn?: string }
): Promise<AppUser> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User document not found.');

  const existingData = snap.data();
  const currentRole = (existingData.role || 'student') as UserRole;

  const updateData: Record<string, any> = {
    ...data,
    profileComplete: true,
  };

  // If demo account with roleProfiles, sync changes into the active roleProfile
  // Only sync when explicitly marked as a demo account to avoid touching protected fields for production users
  if (existingData.isDemo === true && existingData.roleProfiles && existingData.roleProfiles[currentRole]) {
    updateData[`roleProfiles.${currentRole}.name`] = data.name;
    updateData[`roleProfiles.${currentRole}.room`] = data.room;
    if (data.hostel) updateData[`roleProfiles.${currentRole}.hostel`] = data.hostel;
    if (data.usn) updateData[`roleProfiles.${currentRole}.usn`] = data.usn;
    updateData[`roleProfiles.${currentRole}.profileComplete`] = true;
  }

  await setDoc(userRef, updateData, { merge: true });

  const updated = { ...existingData, ...updateData };
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
