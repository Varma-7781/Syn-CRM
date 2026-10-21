/**
 * Activity Service
 * Handles activity CRUD operations with Firestore
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
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from '../config/firebase';
import { Activity } from '../types';
import { logger } from '../lib/logger';

const COLLECTION_NAME = 'activities';

const guardFirebase = () => (!isFirebaseEnabled() || !db ? false : true);

export const normalizeActivity = (a: any): Activity => {
  let ts = new Date().toISOString();
  if (typeof a.timestamp === 'string') {
    ts = a.timestamp;
  } else if (a.timestamp?.toDate && typeof a.timestamp.toDate === 'function') {
    ts = a.timestamp.toDate().toISOString();
  } else if (a.timestamp?.seconds) {
    ts = new Date(a.timestamp.seconds * 1000).toISOString();
  } else if (typeof a.createdAt === 'string') {
    ts = a.createdAt;
  } else if (a.createdAt?.toDate && typeof a.createdAt.toDate === 'function') {
    ts = a.createdAt.toDate().toISOString();
  } else if (a.createdAt?.seconds) {
    ts = new Date(a.createdAt.seconds * 1000).toISOString();
  }
  let timeStr = 'Just now';
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24 && now.getDate() === d.getDate()) {
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      timeStr = 'Yesterday';
    } else {
      timeStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  } catch {}

  return {
    ...a,
    what: a.what || a.description || 'Activity recorded',
    description: a.description || a.what || '',
    who: a.who || a.userName || 'Team member',
    meta: a.meta || (a.companyName ? `${a.companyName}` : 'CRM Activity'),
    t: a.t || timeStr,
    timestamp: ts,
    type: a.type || 'note',
  };
};

/**
 * Get all activities
 */
export const getAllActivities = async (): Promise<Activity[]> => {
  if (!guardFirebase()) return [];
  try {
    const activitiesSnapshot = await getDocs(
      query(collection(db!, COLLECTION_NAME), orderBy('timestamp', 'desc'))
    );
    return activitiesSnapshot.docs.map((d) => normalizeActivity({ id: d.id, ...d.data() }));
  } catch {
    logger.error('[ACTIVITIES] Failed to fetch activities');
    return [];
  }
};

/**
 * Get activity by ID
 */
export const getActivityById = async (activityId: string): Promise<Activity | null> => {
  if (!guardFirebase()) return null;
  try {
    const activityDoc = await getDoc(doc(db!, COLLECTION_NAME, activityId));
    if (!activityDoc.exists()) return null;
    return normalizeActivity({ id: activityDoc.id, ...activityDoc.data() });
  } catch {
    logger.error('[ACTIVITIES] Failed to fetch activity');
    return null;
  }
};

/**
 * Get activities for a specific user
 */
export const getActivitiesByUser = async (userId: string, limitCount?: number): Promise<Activity[]> => {
  if (!guardFirebase()) return [];
  try {
    let q = query(
      collection(db!, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const activitiesSnapshot = await getDocs(q);
    return activitiesSnapshot.docs.map((d) => normalizeActivity({ id: d.id, ...d.data() }));
  } catch {
    logger.error('[ACTIVITIES] Failed to fetch user activities');
    return [];
  }
};

/**
 * Get activities for a specific lead
 */
export const getActivitiesByLead = async (leadId: string): Promise<Activity[]> => {
  if (!guardFirebase()) return [];
  try {
    const q = query(collection(db!, COLLECTION_NAME), where('leadId', '==', leadId));
    const activitiesSnapshot = await getDocs(q);
    return activitiesSnapshot.docs
      .map((d) => normalizeActivity({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    logger.error('[ACTIVITIES] Failed to fetch lead activities');
    return [];
  }
};

/**
 * Add new activity
 */
export const addActivity = async (
  activityData: Omit<Activity, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<string | null> => {
  if (!guardFirebase()) return null;
  try {
    const payload = {
      ...activityData,
      description: activityData.description || activityData.what || '',
      what: activityData.what || activityData.description || '',
      timestamp: activityData.timestamp || new Date().toISOString(),
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db!, COLLECTION_NAME), payload);
    return docRef.id;
  } catch {
    logger.error('[ACTIVITIES] Failed to create activity');
    return null;
  }
};

/**
 * Update activity
 */
export const updateActivity = async (activityId: string, updates: Partial<Activity>): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await updateDoc(doc(db!, COLLECTION_NAME, activityId), {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return true;
  } catch {
    logger.error('[ACTIVITIES] Failed to update activity');
    return false;
  }
};

/**
 * Delete activity
 */
export const deleteActivity = async (activityId: string): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await deleteDoc(doc(db!, COLLECTION_NAME, activityId));
    return true;
  } catch {
    logger.error('[ACTIVITIES] Failed to delete activity');
    return false;
  }
};

/**
 * Subscribe to activities collection changes (real-time)
 */
export const subscribeToActivities = (callback: (activities: Activity[]) => void) => {
  if (!guardFirebase()) return () => {};
  const q = query(collection(db!, COLLECTION_NAME), orderBy('timestamp', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((d) => normalizeActivity({ id: d.id, ...d.data() }));
      callback(activities);
    },
    () => {
      logger.error('[ACTIVITIES] Realtime activities subscription interrupted');
    }
  );
};

/**
 * Subscribe to activities for specific user (real-time)
 */
export const subscribeToUserActivities = (userId: string, callback: (activities: Activity[]) => void) => {
  if (!guardFirebase()) return () => {};
  const q = query(
    collection(db!, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const activities = snapshot.docs.map((d) => normalizeActivity({ id: d.id, ...d.data() }));
      callback(activities);
    },
    () => {
      logger.error('[ACTIVITIES] User activities subscription interrupted');
    }
  );
};
