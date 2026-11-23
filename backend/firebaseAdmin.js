// firebaseAdmin.js — Smallest secure Firebase Admin SDK initialization for PassMate
import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let isInitialized = false;

/**
 * Returns an initialized Firestore Admin instance.
 * Supports multiple standard credential methods:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY: Stringified JSON of the service account key.
 * 2. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY: Individual credential environment variables.
 * 3. GOOGLE_APPLICATION_CREDENTIALS: Path to a local service account JSON file.
 * 4. Fallback: Project ID initialization for environments using Application Default Credentials (ADC) or emulator.
 */
export function getAdminDb() {
  if (!isInitialized) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'passmate-app-43c97';

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: cert(creds),
          projectId: creds.project_id || projectId,
        });
        isInitialized = true;
      } catch (err) {
        console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
      }
    } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        admin.initializeApp({
          credential: cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          }),
          projectId,
        });
        isInitialized = true;
      } catch (err) {
        console.error('[Firebase Admin] Failed to initialize with FIREBASE_CLIENT_EMAIL / PRIVATE_KEY:', err.message);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        admin.initializeApp({
          projectId,
        });
        isInitialized = true;
      } catch (err) {
        console.error('[Firebase Admin] Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS:', err.message);
      }
    } else {
      try {
        admin.initializeApp({ projectId });
        isInitialized = true;
      } catch (err) {
        console.warn('[Firebase Admin] Notice: Initialized without explicit service account credentials. ADC or emulator will be used:', err.message);
      }
    }
  }

  return getFirestore();
}

/**
 * Returns an initialized Auth Admin instance.
 */
export function getAdminAuth() {
  getAdminDb(); // ensures Firebase app is initialized
  return getAuth();
}

export default admin;
