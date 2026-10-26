/**
 * Target Service
 * Handles target CRUD operations with Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../config/firebase';
import { Target } from '../types';
import { logger } from '../lib/logger';

const COLLECTION_NAME = 'targets';

const guardFirebase = () => (!isFirebaseEnabled() || !db ? false : true);

/**
 * Get all targets
 */
export const getAllTargets = async (): Promise<Target[]> => {
  if (!guardFirebase()) return [];
  try {
    const targetsSnapshot = await getDocs(collection(db!, COLLECTION_NAME));
    return targetsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Target));
  } catch {
    logger.error('[TARGETS] Failed to fetch targets');
    return [];
  }
};

/**
 * Get target by ID
 */
export const getTargetById = async (targetId: string): Promise<Target | null> => {
  if (!guardFirebase()) return null;
  try {
    const targetDoc = await getDoc(doc(db!, COLLECTION_NAME, targetId));
    if (!targetDoc.exists()) return null;
    return { id: targetDoc.id, ...targetDoc.data() } as Target;
  } catch {
    logger.error('[TARGETS] Failed to fetch target');
    return null;
  }
};

/**
 * Get targets for a specific user
 */
export const getTargetsByUser = async (userId: string): Promise<Target[]> => {
  if (!guardFirebase()) return [];
  try {
    const q = query(collection(db!, COLLECTION_NAME), where('userId', '==', userId));
    const targetsSnapshot = await getDocs(q);
    return targetsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Target));
  } catch {
    logger.error('[TARGETS] Failed to fetch user targets');
    return [];
  }
};

/**
 * Add new target
 */
export const addTarget = async (targetData: Omit<Target, 'id' | 'achieved'> & { achieved?: number }): Promise<string | null> => {
  if (!guardFirebase()) return null;
  try {
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), {
      ...targetData,
      achieved: targetData.achieved || 0,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch {
    logger.error('[TARGETS] Failed to create target');
    return null;
  }
};

/**
 * Update target
 */
export const updateTarget = async (targetId: string, updates: Partial<Target>): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await updateDoc(doc(db!, COLLECTION_NAME, targetId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch {
    logger.error('[TARGETS] Failed to update target');
    return false;
  }
};

/**
 * Delete target
 */
export const deleteTarget = async (targetId: string): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await deleteDoc(doc(db!, COLLECTION_NAME, targetId));
    return true;
  } catch {
    logger.error('[TARGETS] Failed to delete target');
    return false;
  }
};

/**
 * Subscribe to targets collection changes (real-time)
 */
export const subscribeToTargets = (callback: (targets: Target[]) => void) => {
  if (!guardFirebase()) return () => {};
  const q = query(collection(db!, COLLECTION_NAME), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const targets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Target));
      callback(targets);
    },
    () => {
      logger.error('[TARGETS] Realtime targets subscription interrupted');
    }
  );
};

/**
 * Subscribe to targets for specific user (real-time)
 */
export const subscribeToUserTargets = (userId: string, callback: (targets: Target[]) => void) => {
  if (!guardFirebase()) return () => {};
  const q = query(
    collection(db!, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const targets = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Target))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(targets);
    },
    (err) => {
      logger.error('[TARGETS] User targets subscription interrupted', err?.message || err);
    }
  );
};
