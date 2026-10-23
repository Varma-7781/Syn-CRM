/**
 * Firebase Configuration for NexLead CRM
 */

import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';
import type { Messaging } from 'firebase/messaging';
import { logger } from '../lib/logger';

// Official Production Firebase Configuration for NexLead CRM
const SYNTRAXS_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDYBDR-7wEJx8s7LOME-Dm6iCtxhj_72a0',
  authDomain: 'crm-syntraxs.firebaseapp.com',
  databaseURL: '',
  projectId: 'crm-syntraxs',
  storageBucket: 'crm-syntraxs.firebasestorage.app',
  messagingSenderId: '656349903092',
  appId: '1:656349903092:web:b83f5582c2c80c8b0e06a1',
  measurementId: 'G-9HQR7TSHJK',
};

// Protect against deprecated legacy environments (e.g. bristletech-crm-4a99d)
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const isLegacyEnvironment = rawProjectId === 'bristletech-crm-4a99d';

export const firebaseConfig = {
  apiKey: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_API_KEY) || SYNTRAXS_FIREBASE_CONFIG.apiKey,
  authDomain: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || SYNTRAXS_FIREBASE_CONFIG.authDomain,
  databaseURL: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_DATABASE_URL) || SYNTRAXS_FIREBASE_CONFIG.databaseURL,
  projectId: (!isLegacyEnvironment && rawProjectId) || SYNTRAXS_FIREBASE_CONFIG.projectId,
  storageBucket: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || SYNTRAXS_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || SYNTRAXS_FIREBASE_CONFIG.messagingSenderId,
  appId: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_APP_ID) || SYNTRAXS_FIREBASE_CONFIG.appId,
  measurementId: (!isLegacyEnvironment && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || SYNTRAXS_FIREBASE_CONFIG.measurementId,
};

// Production Firebase is always reliably configured
const isFirebaseConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId);
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let messaging: Messaging | null = null;

if (isFirebaseConfigured()) {
  try {
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
  } catch {
    logger.error('[FIREBASE] Initialization failed');
  }
} else {
  logger.warn('[FIREBASE] Firebase configuration is incomplete in environment variables');
}

export { app, auth, db, analytics, messaging };

export const isFirebaseEnabled = (): boolean => {
  return app !== null && auth !== null && db !== null;
};
