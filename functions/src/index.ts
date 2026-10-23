/**
 * Firebase Cloud Function: createSalesUser
 * Secure server-side sales user provisioning with Firebase Admin SDK
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface CreateSalesUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  targetQuota?: number;
}

export const createSalesUser = functions.https.onCall(
  async (data: CreateSalesUserRequest, context) => {
    // 1. Verify caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required to create a sales representative.'
      );
    }

    const callerUid = context.auth.uid;

    // 2. Verify caller has Admin role in Firestore
    const callerSnap = await db.collection('users').doc(callerUid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can create sales representatives.'
      );
    }

    // 3. Validate inputs
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!name || name.length < 2) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Full name must be at least 2 characters.'
      );
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid work email is required.'
      );
    }

    if (!password || password.length < 6) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Password must be at least 6 characters.'
      );
    }

    // 4. Create Firebase Authentication user via Admin SDK
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        phoneNumber: data.phone && data.phone.startsWith('+') ? data.phone : undefined,
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'A user with this email address already exists.'
        );
      }
      throw new functions.https.HttpsError('internal', authErr.message);
    }

    // 5. Create Firestore user document (enforcing role as 'sales')
    const authUid = userRecord.uid;
    const userProfile = {
      id: authUid,
      name,
      email,
      role: 'sales', // Enforced server-side
      department: data.department || 'Sales',
      phone: data.phone || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid,
    };

    try {
      await db.collection('users').doc(authUid).set(userProfile);

      // Create initial monthly target quota (sanitized numeric bounds)
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const parsedQuota = Number(data.targetQuota);
      const targetQuota = isNaN(parsedQuota) ? 1500000 : Math.max(0, Math.min(parsedQuota, 1000000000));
      await db.collection('targets').doc(`target_${authUid}_${currentPeriod}`).set({
        userId: authUid,
        userName: name,
        type: 'monthly',
        period: currentPeriod,
        target: targetQuota,
        achieved: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        user: {
          id: authUid,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          department: userProfile.department,
          phone: userProfile.phone,
        },
      };
    } catch (dbErr: any) {
      // Rollback Auth user if database write fails
      await admin.auth().deleteUser(authUid).catch(() => {});
      throw new functions.https.HttpsError(
        'internal',
        'Failed to save user profile in Firestore. Reverted Auth account.'
      );
    }
  }
);

interface CreateAdminUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
}

export const createAdminUser = functions.https.onCall(
  async (data: CreateAdminUserRequest, context) => {
    // 1. Verify caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Authentication required to create an administrator.'
      );
    }

    const callerUid = context.auth.uid;

    // 2. Verify caller has Admin role in Firestore
    const callerSnap = await db.collection('users').doc(callerUid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can create administrator accounts.'
      );
    }

    // 3. Validate inputs
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!name || name.length < 2) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Full name must be at least 2 characters.'
      );
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid work email is required.'
      );
    }

    if (!password || password.length < 6) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Password must be at least 6 characters.'
      );
    }

    // 4. Create Firebase Authentication user via Admin SDK
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        phoneNumber: data.phone && data.phone.startsWith('+') ? data.phone : undefined,
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'A user with this email address already exists.'
        );
      }
      throw new functions.https.HttpsError('internal', authErr.message);
    }

    // 5. Create Firestore user document (enforcing role as 'admin')
    const authUid = userRecord.uid;
    const userProfile = {
      id: authUid,
      name,
      email,
      role: 'admin', // Enforced server-side
      department: data.department || 'Management',
      phone: data.phone || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid,
    };

    try {
      await db.collection('users').doc(authUid).set(userProfile);

      return {
        success: true,
        user: {
          id: authUid,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          department: userProfile.department,
          phone: userProfile.phone,
        },
      };
    } catch (dbErr: any) {
      // Rollback Auth user if database write fails
      await admin.auth().deleteUser(authUid).catch(() => {});
      throw new functions.https.HttpsError(
        'internal',
        'Failed to save user profile in Firestore. Reverted Auth account.'
      );
    }
  }
);
