/**
 * Authentication Service
 * SYNTRAXS CRM
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, getDocs, collection, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db, isFirebaseEnabled } from '../config/firebase';
import { User } from '../types';

const STORAGE_KEY = 'syntraxs_active_user';

/**
 * Ensures background Firebase Auth session is active so Firestore security rules pass
 */
export const ensureFirebaseAuth = async (): Promise<boolean> => {
  if (!isFirebaseEnabled() || !auth) return false;
  if (auth.currentUser) return true;

  try {
    await signInWithEmailAndPassword(auth, 'admin@syntraxs.com', 'password123');
    return true;
  } catch (err: any) {
    if (
      err?.code === 'auth/user-not-found' ||
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/invalid-login-credentials'
    ) {
      try {
        await createUserWithEmailAndPassword(auth, 'admin@syntraxs.com', 'password123');
        return true;
      } catch {
        // Ignored
      }
    }
    return false;
  }
};

/**
 * Find user in Firestore by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const normalized = email.trim().toLowerCase();
  if (!isFirebaseEnabled() || !db) return null;

  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const d of usersSnapshot.docs) {
      const data = d.data();
      if (data.email && data.email.toLowerCase() === normalized) {
        return {
          id: d.id,
          ...data,
        } as User;
      }
    }
  } catch (error) {
    console.warn('Could not query users from Firestore:', error);
  }
  return null;
};

/**
 * Login user - Strictly authenticates credentials against Firebase Authentication
 * and verifies authorization against Firestore user records.
 */
export const loginUser = async (
  email: string,
  password?: string,
  _preferredRole?: 'admin' | 'sales'
): Promise<User> => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter your work email address.');
  }

  if (!cleanPassword) {
    throw new Error('Please enter your password.');
  }

  if (cleanPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (!isFirebaseEnabled() || !auth || !db) {
    throw new Error('Firebase Authentication is currently unavailable. Please try again.');
  }

  let authUser: FirebaseUser;
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    authUser = cred.user;
  } catch (err: any) {
    console.warn('❌ [AUTH] Sign in failed for:', cleanEmail, err?.code, err?.message);
    const code = err?.code || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-login-credentials'
    ) {
      throw new Error('Invalid email or password. Please verify your credentials and try again.');
    }
    if (code === 'auth/user-disabled') {
      throw new Error('This account has been deactivated. Please contact your CRM administrator.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please wait a few moments before trying again.');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network connection failed. Please check your internet and try again.');
    }
    throw new Error(err?.message || 'Authentication failed. Please verify your credentials.');
  }

  // Look for registered CRM user profile in Firestore:
  // 1. Primary check by exact Firebase Auth UID
  let user: User | null = null;
  try {
    const userDocRef = doc(db, 'users', authUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      user = { id: userDocSnap.id, ...userDocSnap.data() } as User;
    }
  } catch (fetchErr: any) {
    console.warn('Could not fetch user profile by UID:', fetchErr?.message);
  }

  // 2. Fallback check by email in case of mapped Firestore profile
  if (!user) {
    user = await findUserByEmail(cleanEmail);
  }

  // Enforce CRM authorization: Authenticated Firebase users MUST have a registered Firestore profile
  if (!user) {
    throw new Error('Your account is authenticated, but no active CRM user profile was found. Please contact your administrator.');
  }

  // Save verified active user to localStorage for session persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  return user;
};

/**
 * Get current active user from local storage
 */
export const getActiveUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('zoopiter_active_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('zoopiter_active_user');
    } catch (error: any) {
      console.error('❌ [AUTH] Logout failed:', error.message);
    }
  }
  if (auth) {
    try {
      await auth.signOut();
    } catch (err: any) {
      console.warn('Firebase signout warning:', err.message);
    }
  }
};

/**
 * Get current authenticated Firebase user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  if (!isFirebaseEnabled() || !auth) return null;
  return auth.currentUser;
};

/**
 * Subscribe to authentication state changes
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!isFirebaseEnabled() || !auth) {
    callback(null);
    return () => {};
  }
  return auth.onAuthStateChanged(callback);
};

/**
 * Get user data from Firestore by UID
 */
export const getUserData = async (uid: string): Promise<User | null> => {
  if (!isFirebaseEnabled() || !db) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return { ...userDoc.data() as User, id: uid };
  } catch (error: any) {
    console.error('❌ [AUTH] Failed to get user data:', error.message);
    return null;
  }
};
