/**
 * Lead Service
 * Handles lead CRUD operations with Firestore
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
import { Lead } from '../types';
import { logger } from '../lib/logger';

const COLLECTION_NAME = 'leads';

const guardFirebase = () => (!isFirebaseEnabled() || !db ? false : true);

export const normalizeLead = (raw: any, index?: number): Lead => {
  const company = raw.companyName || raw.company || 'Unknown Company';
  const client = raw.contactName || raw.client || 'Unknown Contact';
  let createdAtStr = new Date().toISOString();
  if (typeof raw.createdAt === 'string') {
    createdAtStr = raw.createdAt;
  } else if (raw.createdAt?.toDate && typeof raw.createdAt.toDate === 'function') {
    createdAtStr = raw.createdAt.toDate().toISOString();
  } else if (raw.createdAt?.seconds) {
    createdAtStr = new Date(raw.createdAt.seconds * 1000).toISOString();
  } else if (raw.timestamp?.toDate && typeof raw.timestamp.toDate === 'function') {
    createdAtStr = raw.timestamp.toDate().toISOString();
  }
  const date = raw.date || (createdAtStr.includes('T') ? createdAtStr.split('T')[0] : createdAtStr);
  const rep = raw.assignedToName || raw.rep || null;

  return {
    ...raw,
    company,
    companyName: company,
    client,
    contactName: client,
    date,
    createdAt: createdAtStr,
    rep,
    assignedToName: rep || undefined,
    sno: typeof raw.sno === 'number' ? raw.sno : (index !== undefined ? index + 1 : 1),
    value: typeof raw.value === 'number' ? raw.value : (Number(raw.value) || 0),
    status: raw.status || 'new',
    priority: raw.priority || 'medium',
    phone: raw.phone || '',
    email: raw.email || '',
    requirement: raw.requirement || '',
    designation: raw.designation || '',
    category: raw.category || 'General',
    notes: raw.notes || '',
  };
};

/**
 * Get all leads
 */
export const getAllLeads = async (): Promise<Lead[]> => {
  if (!guardFirebase()) return [];
  try {
    const leadsSnapshot = await getDocs(collection(db!, COLLECTION_NAME));
    return leadsSnapshot.docs.map((d, i) => normalizeLead({ id: d.id, ...d.data() }, i));
  } catch {
    logger.error('[LEADS] Failed to fetch leads');
    return [];
  }
};

/**
 * Get lead by ID
 */
export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  if (!guardFirebase()) return null;
  try {
    const leadDoc = await getDoc(doc(db!, COLLECTION_NAME, leadId));
    if (!leadDoc.exists()) return null;
    return normalizeLead({ id: leadDoc.id, ...leadDoc.data() });
  } catch {
    logger.error('[LEADS] Failed to fetch lead');
    return null;
  }
};

/**
 * Get leads assigned to a specific user
 */
export const getLeadsByUser = async (userId: string): Promise<Lead[]> => {
  if (!guardFirebase()) return [];
  try {
    const q = query(collection(db!, COLLECTION_NAME), where('assignedTo', '==', userId));
    const leadsSnapshot = await getDocs(q);
    return leadsSnapshot.docs.map((d, i) => normalizeLead({ id: d.id, ...d.data() }, i));
  } catch {
    logger.error('[LEADS] Failed to fetch user leads');
    return [];
  }
};

/**
 * Add new lead
 */
export const addLead = async (leadData: Partial<Lead>): Promise<string | null> => {
  if (!guardFirebase()) return null;
  try {
    const companyName = leadData.companyName || leadData.company || '';
    const contactName = leadData.contactName || leadData.client || '';
    const assignedToName = leadData.assignedToName || leadData.rep || '';

    const payload: any = {
      ...leadData,
      companyName,
      contactName,
      createdAt: leadData.createdAt || new Date().toISOString(),
      callHistory: leadData.callHistory || [],
      productsOffered: leadData.productsOffered || [],
      notes: leadData.notes || '',
      status: leadData.status || 'new',
      priority: leadData.priority || 'medium',
      value: Number(leadData.value) || 0,
      timestamp: Timestamp.now(),
    };

    if (assignedToName) {
      payload.assignedToName = assignedToName;
    } else {
      delete payload.assignedToName;
    }

    // Clean any undefined properties
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    const docRef = await addDoc(collection(db!, COLLECTION_NAME), payload);
    return docRef.id;
  } catch {
    logger.error('[LEADS] Failed to create lead');
    return null;
  }
};

/**
 * Update lead
 */
export const updateLead = async (leadId: string, updates: Partial<Lead>): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    const payload: any = { ...updates, updatedAt: Timestamp.now() };
    if (updates.company && !updates.companyName) payload.companyName = updates.company;
    if (updates.client && !updates.contactName) payload.contactName = updates.client;
    if (updates.rep && !updates.assignedToName) payload.assignedToName = updates.rep;

    // Clean any undefined properties
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    await updateDoc(doc(db!, COLLECTION_NAME, leadId), payload);
    return true;
  } catch {
    logger.error('[LEADS] Failed to update lead');
    return false;
  }
};

/**
 * Delete lead
 */
export const deleteLead = async (leadId: string): Promise<boolean> => {
  if (!guardFirebase()) return false;
  try {
    await deleteDoc(doc(db!, COLLECTION_NAME, leadId));
    return true;
  } catch {
    logger.error('[LEADS] Failed to delete lead');
    return false;
  }
};

/**
 * Subscribe to leads collection changes (real-time)
 */
export const subscribeToLeads = (callback: (leads: Lead[]) => void) => {
  if (!guardFirebase()) return () => {};

  const q = query(collection(db!, COLLECTION_NAME), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const leads = snapshot.docs.map((d, i) => normalizeLead({ id: d.id, ...d.data() }, i));
      callback(leads);
    },
    () => {
      logger.error('[LEADS] Realtime subscription interrupted');
    }
  );
};

/**
 * Subscribe to leads for specific user (real-time)
 */
export const subscribeToUserLeads = (userId: string, callback: (leads: Lead[]) => void) => {
  if (!guardFirebase()) return () => {};
  // Avoid compound inequality/ordering query that requires manual composite Firestore indexes
  const q = query(
    collection(db!, COLLECTION_NAME),
    where('assignedTo', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const leads = snapshot.docs
        .map((d, i) => normalizeLead({ id: d.id, ...d.data() }, i))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(leads);
    },
    (err) => {
      logger.error('[LEADS] User leads subscription interrupted', err?.message || err);
    }
  );
};
