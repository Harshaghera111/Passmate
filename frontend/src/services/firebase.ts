// firebase.ts — Firebase initialization
// Replace the firebaseConfig below with your actual Firebase project credentials.
// Get them from: Firebase Console → Project Settings → Your apps → Web app

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyPLACEHOLDER',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'passmate-demo.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'passmate-demo',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'passmate-demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:000000000000:web:0000000000000000',
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;
