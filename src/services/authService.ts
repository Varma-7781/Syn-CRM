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

const STORAGE_KEY = 'zoopiter_active_user';

/**
 * Ensures background Firebase Auth session is active so Firestore security rules pass
 */
export const ensureFirebaseAuth = async (): Promise<boolean> => {
  if (!isFirebaseEnabled() || !auth) return false;
  if (auth.currentUser) return true;

  try {
    await signInWithEmailAndPassword(auth, 'admin@zoopiter.com', 'admin123456');
    return true;
  } catch (err: any) {
    if (
      err?.code === 'auth/user-not-found' ||
      err?.code === 'auth/invalid-credential' ||
      err?.code === 'auth/invalid-login-credentials'
    ) {
      try {
        await createUserWithEmailAndPassword(auth, 'admin@zoopiter.com', 'admin123456');
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
 * Login user - Accepts credentials and synchronizes with Firestore / local session
 */
export const loginUser = async (
  email: string,
  _password?: string,
  preferredRole?: 'admin' | 'sales'
): Promise<User | null> => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter an email address.');
  }

  // Ensure background Firebase connection is active so Firestore works
  await ensureFirebaseAuth();

  // Look for existing user in Firestore
  let user = await findUserByEmail(cleanEmail);

  if (!user) {
    // Determine role: use preferred role, or check email keywords
    const defaultRole: 'admin' | 'sales' = preferredRole
      ? preferredRole
      : (cleanEmail.includes('admin') || cleanEmail.includes('cso') || cleanEmail.includes('manager')
        ? 'admin'
        : 'sales');

    const rawName = cleanEmail.split('@')[0];
    const formattedName = rawName
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    user = {
      id: uid,
      name: formattedName || 'User',
      email: cleanEmail,
      role: defaultRole,
      phone: '',
      department: defaultRole === 'admin' ? 'Management' : 'Sales',
    };

    if (isFirebaseEnabled() && db) {
      try {
        await setDoc(doc(db, 'users', uid), {
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          department: user.department || '',
          createdAt: Timestamp.now(),
        });
      } catch (err) {
        console.warn('Could not save user to Firestore:', err);
      }
    }
  } else if (preferredRole && user.role !== preferredRole) {
    // If user explicitly toggled role on login screen, update role
    user.role = preferredRole;
    if (isFirebaseEnabled() && db) {
      try {
        await setDoc(doc(db, 'users', user.id), { role: preferredRole }, { merge: true });
      } catch (err) {
        console.warn('Could not update role in Firestore:', err);
      }
    }
  }

  // Save active user to localStorage for session persistence
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
    const raw = localStorage.getItem(STORAGE_KEY);
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
