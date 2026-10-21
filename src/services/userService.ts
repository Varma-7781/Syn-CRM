/**
 * User Service
 * Handles user CRUD operations with Firestore and Firebase Authentication
 */

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, deleteUser as deleteAuthUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { firebaseConfig, auth, db, isFirebaseEnabled } from '../config/firebase';
import { User, CreateSalesRepresentativeInput } from '../types';

const COLLECTION_NAME = 'users';

const guardFirebase = () => (!isFirebaseEnabled() || !db ? false : true);

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  if (!guardFirebase()) return [];
  try {
    const usersSnapshot = await getDocs(collection(db!, COLLECTION_NAME));
    return usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as User));
  } catch (error: any) {
    console.error('❌ [USERS] Failed to fetch users:', error.message);
    return [];
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  if (!guardFirebase()) return null;
  try {
    const userDoc = await getDoc(doc(db!, COLLECTION_NAME, userId));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as User;
  } catch (error: any) {
    console.error('❌ [USERS] Failed to fetch user:', error.message);
    return null;
  }
};

/**
 * Add new user
 */
export const addUser = async (userData: Omit<User, 'id'>): Promise<string | null> => {
  if (!guardFirebase()) return null;
  try {
    const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    await setDoc(doc(db!, COLLECTION_NAME, uid), {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      phone: userData.phone || '',
      department: userData.department || (userData.role === 'admin' ? 'Management' : 'Sales'),
      createdAt: Timestamp.now(),
    });
    return uid;
  } catch (error: any) {
    console.error('❌ [USERS] Failed to create user:', error.message);
    return null;
  }
};

/**
 * Update user
 */
export const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await updateDoc(doc(db!, COLLECTION_NAME, userId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch (error: any) {
    console.error('❌ [USERS] Failed to update user:', error.message);
    return false;
  }
};

/**
 * Create a new Sales Representative in Firebase Authentication and Firestore.
 * Uses an isolated secondary Firebase App instance so the current Administrator
 * remains 100% signed in without their session or token being touched.
 */
export const createSalesUser = async (
  input: CreateSalesRepresentativeInput
): Promise<{ success: boolean; user?: User; error?: string }> => {
  if (!guardFirebase()) {
    return { success: false, error: 'Firebase is not initialized or offline.' };
  }

  // 1. Validate inputs
  const cleanName = (input.name || '').trim();
  const cleanEmail = (input.email || '').trim().toLowerCase();
  const password = input.password || '';

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Full name is required (at least 2 characters).' };
  }
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please enter a valid work email address.' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  // 2. Check for duplicate email in Firestore users
  try {
    const existingSnap = await getDocs(collection(db!, COLLECTION_NAME));
    const duplicate = existingSnap.docs.some(
      (d) => d.data().email && d.data().email.toLowerCase() === cleanEmail
    );
    if (duplicate) {
      return { success: false, error: 'A user with this email already exists in the CRM.' };
    }
  } catch (err: any) {
    console.warn('Could not check existing users:', err.message);
  }

  // 3. Optional server endpoint invocation if configured
  const cloudFunctionUrl = import.meta.env.VITE_CREATE_SALES_FUNCTION_URL;
  if (cloudFunctionUrl && auth?.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          phone: input.phone || '',
          department: input.department || 'Sales',
          targetQuota: input.targetQuota || 1500000,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Server error creating user' };
      }
      return { success: true, user: data.user };
    } catch (fnErr: any) {
      console.warn('Cloud Function unavailable, using direct isolated secondary auth provisioning:', fnErr.message);
    }
  }

  // 4. Isolated Secondary Firebase App Provisioning
  // Guarantees Admin stays completely signed in on the default app
  const secondaryAppName = `provision-sales-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  let secondaryApp: any = null;
  let createdAuthUser: any = null;
  let authUid = '';

  try {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    createdAuthUser = userCred.user;
    authUid = createdAuthUser.uid;

    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
    secondaryApp = null;
  } catch (authErr: any) {
    if (secondaryApp) {
      await deleteApp(secondaryApp).catch(() => {});
    }
    if (authErr.code === 'auth/email-already-in-use') {
      return { success: false, error: 'This email is already registered in Firebase Authentication.' };
    }
    if (authErr.code === 'auth/weak-password') {
      return { success: false, error: 'Password should be at least 6 characters long.' };
    }
    if (authErr.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email address format.' };
    }
    return {
      success: false,
      error: authErr.message || 'Failed to create user in Firebase Authentication.',
    };
  }

  // 5. Create Firestore user profile under the exact matching Auth UID
  try {
    const userProfile: User = {
      id: authUid,
      name: cleanName,
      email: cleanEmail,
      role: 'sales', // Enforce sales role strictly
      department: input.department?.trim() || 'Sales',
      phone: input.phone?.trim() || '',
      createdAt: Timestamp.now(),
    };

    await setDoc(doc(db!, COLLECTION_NAME, authUid), {
      ...userProfile,
      createdBy: auth?.currentUser?.uid || 'admin',
    });

    // 6. Create monthly target quota for the new rep in Firestore
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const targetQuota = Number(input.targetQuota) || 1500000;
    await setDoc(doc(db!, 'targets', `target_${authUid}_${currentPeriod}`), {
      userId: authUid,
      userName: cleanName,
      type: 'monthly',
      period: currentPeriod,
      target: targetQuota,
      achieved: 0,
      createdAt: Timestamp.now(),
    });

    return { success: true, user: userProfile };
  } catch (firestoreErr: any) {
    console.error('❌ [USERS] Firestore profile creation failed:', firestoreErr);

    // Rollback: Attempt cleanup of newly created Auth user to avoid orphan account
    if (createdAuthUser) {
      try {
        const cleanupApp = initializeApp(firebaseConfig, `cleanup-${Date.now()}`);
        const cleanupAuth = getAuth(cleanupApp);
        const reSign = await createUserWithEmailAndPassword(cleanupAuth, cleanEmail, password);
        await deleteAuthUser(reSign.user);
        await deleteApp(cleanupApp);
      } catch (cleanErr: any) {
        console.warn('Could not roll back auth account:', cleanErr.message);
      }
    }

    return {
      success: false,
      error: 'Firebase Auth account was created, but failed to save profile to Firestore.',
    };
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await deleteDoc(doc(db!, COLLECTION_NAME, userId));
    return true;
  } catch (error: any) {
    console.error('❌ [USERS] Failed to delete user:', error.message);
    return false;
  }
};

/**
 * Subscribe to users collection changes (real-time)
 */
export const subscribeToUsers = (callback: (users: User[]) => void) => {
  if (!guardFirebase()) return () => {};
  const q = query(collection(db!, COLLECTION_NAME), orderBy('name'));

  return onSnapshot(
    q,
    (snapshot) => {
      const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as User));
      callback(users);
    },
    (error) => {
      console.error('❌ [USERS] Subscription error:', error.message);
    }
  );
};
