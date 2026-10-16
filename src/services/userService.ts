/**
 * User Service
 * Handles user CRUD operations with Firestore
 */

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
import { db, isFirebaseEnabled } from '../config/firebase';
import { User } from '../types';

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
