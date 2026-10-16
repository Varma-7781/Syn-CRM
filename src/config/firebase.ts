/**
 * Firebase Configuration for SYNTRAXS CRM
 */

import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';
import type { Messaging } from 'firebase/messaging';

// Check if all required Firebase environment variables are present
const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

if (isFirebaseConfigured()) {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Client-side only initializations
    if (typeof window !== 'undefined') {
      import('firebase/analytics').then(({ getAnalytics, isSupported }) => {
        isSupported().then((supported) => {
          if (supported && app) analytics = getAnalytics(app);
        }).catch(() => {});
      }).catch(() => {});

      import('firebase/messaging').then(({ getMessaging, isSupported }) => {
        isSupported().then((supported) => {
          if (supported && app) messaging = getMessaging(app);
        }).catch(() => {});
      }).catch(() => {});
    }
  } catch (error) {
    console.error('❌ [FIREBASE] Initialization failed:', error);
  }
} else {
  console.warn('❗ [FIREBASE] Firebase configuration is incomplete in .env');
}

export { app, auth, db, analytics, messaging };

export const isFirebaseEnabled = (): boolean => {
  return app !== null && auth !== null && db !== null;
};
