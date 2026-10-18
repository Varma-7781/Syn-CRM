# SYNTRAXS CRM — New Firebase Project Requirements & Setup Specification

> **Document Status**: Complete & Verified  
> **Target Application**: `lovable-syntraxs-ui` (Syntraxs Technologies Enterprise CRM)  
> **Codebase Root**: `c:\Users\Asus\Downloads\Syntraxs-Proj\zoopiter_crm_oct\lovable-syntraxs-ui`  
> **Date**: October 2026  
> **Author**: Senior Firebase Architect & DevOps Lead  

---

## 1. Executive Summary

This document specifies the exact setup, configuration, security rules, indexes, and user accounts required in the **new Firebase project** before switching the application connection.

Nothing should be assumed to exist in the new Firebase project. This specification serves as a turn-key build guide for the new company's Firebase Administrator.

---

## 2. Required Firebase Services

| Service | Status | Justification / Usage |
| :--- | :--- | :--- |
| **Cloud Firestore** | **REQUIRED** | Core database storing `leads`, `users`, `targets`, and `activities`. Must be in Native mode. |
| **Firebase Authentication** | **REQUIRED** | Required for authenticated SDK tokens, session verification, and security rule enforcement. |
| **Firebase Hosting** | **OPTIONAL / DEPENDENT** | Optional. The project currently compiles via Nitro with Cloudflare / Vercel adapters, but can also be hosted on Firebase Hosting. |
| **Firebase Cloud Storage** | **NOT REQUIRED** | No active document or media storage upload dependencies in current codebase. |
| **Firebase Cloud Functions** | **NOT REQUIRED** | Current application logic runs entirely client-side. No background function triggers are in use. |
| **Firebase Cloud Messaging (FCM)** | **OPTIONAL** | Optional. Follow-up notifications currently use standard browser HTML5 desktop notifications. |
| **Firebase Analytics** | **OPTIONAL** | Supported in `src/config/firebase.ts` if `measurementId` is provided, but gracefully skips if absent. |

---

## 3. Environment Variables Specification

The frontend application requires the following environment variables. In the new environment, these will be placed in `lovable-syntraxs-ui/.env`:

| Environment Variable | Required | Description / Example Format |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | **YES** | Public API key for web app (e.g., `AIzaSy...`). |
| `VITE_FIREBASE_AUTH_DOMAIN` | **YES** | Authentication domain (e.g., `<project-id>.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | **YES** | New Firebase project identifier (e.g., `syntraxs-crm-prod`). |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Storage bucket (e.g., `<project-id>.firebasestorage.app`). |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Optional | Numeric sender ID for Cloud Messaging. |
| `VITE_FIREBASE_APP_ID` | **YES** | Firebase web app registration ID (e.g., `1:123456789:web:...`). |
| `VITE_FIREBASE_DATABASE_URL` | Optional | Realtime Database URL (unused, can remain empty). |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Google Analytics measurement ID (e.g., `G-...`). |

---

## 4. Required Firestore Collections & Schema

The new Firestore instance must accommodate four primary collections:

### 4.1 Collection: `leads`
- **Doc ID Convention**: Auto-generated 20-character Firestore ID.
- **Minimum Schema**:
  ```typescript
  {
    companyName: string;            // Required
    contactName: string;            // Required
    designation?: string;           // Optional
    phone: string;                  // Required
    email: string;                  // Required
    requirement?: string;           // Optional
    category: string;               // e.g. "Enterprise", "SMB", "Startup"
    source: string;                 // e.g. "Inbound", "Excel Import"
    value: number;                  // Deal value in INR
    status: string;                 // 'new' | 'quotation_sent' | 'interested' | 'not_able_to_contact' | 'not_interested' | 'won' | 'pending_payment' | 'follow_up' | 'lost' | 'dnp'
    priority: string;               // 'low' | 'medium' | 'high'
    assignedTo?: string;            // User doc ID
    assignedToName?: string;        // Sales rep display name
    createdAt: string;              // ISO 8601 string
    updatedAt?: Timestamp;          // Firestore Timestamp
    nextFollowUp?: string;          // ISO or YYYY-MM-DDTHH:mm
    followUpStatus?: string;        // 'pending' | 'reminded' | 'completed' | 'overdue'
    followUpRemindedAt?: string;    // ISO 8601 string
    followUpCompletedAt?: string;   // ISO 8601 string
    followUpOverdueReason?: string; // 'dismissed' | 'no_action'
    notes?: string;                 // Plain text notes
    callHistory?: object[];         // Array of past interactions
    productsOffered?: string[];     // Solution names
  }
  ```

### 4.2 Collection: `users`
- **Doc ID Convention**: Client-generated UID (`usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`) or Auth UID.
- **Minimum Schema**:
  ```typescript
  {
    name: string;                   // Full display name
    email: string;                  // Lowercased email address
    role: 'admin' | 'sales';        // Access role
    phone?: string;                 // Contact phone
    department: string;             // "Management" or "Sales"
    createdAt: Timestamp;           // Firestore Timestamp
    updatedAt?: Timestamp;          // Firestore Timestamp
  }
  ```

### 4.3 Collection: `targets`
- **Doc ID Convention**: Auto-generated 20-character Firestore ID.
- **Minimum Schema**:
  ```typescript
  {
    userId: string;                 // User doc ID or user display name
    type: 'weekly' | 'monthly';     // Target interval
    period: string;                 // "YYYY-MM" or "YYYY-Www"
    target: number;                 // Monetary target in INR
    achieved: number;               // Base achieved amount in INR
    createdAt: Timestamp;           // Firestore Timestamp
    updatedAt?: Timestamp;          // Firestore Timestamp
  }
  ```

### 4.4 Collection: `activities`
- **Doc ID Convention**: Auto-generated 20-character Firestore ID.
- **Minimum Schema**:
  ```typescript
  {
    userId: string;                 // User doc ID
    userName?: string;              // User display name
    leadId?: string;                // Lead doc ID (optional)
    companyName?: string;           // Company name for context
    type: string;                   // 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'won'
    description: string;            // Log details
    timestamp: string;              // ISO 8601 string
    createdAt: Timestamp;           // Firestore Timestamp
    updatedAt?: Timestamp;          // Firestore Timestamp
  }
  ```

---

## 5. Required Composite Indexes

Firestore requires explicit composite indexes for queries filtering by an equality field while ordering by a second field:

### Index 1: `leads` User Query
- **Collection**: `leads`
- **Fields**:
  1. `assignedTo` (Ascending)
  2. `createdAt` (Descending)
- **Scope**: Collection
- **Used by**: `subscribeToUserLeads`

### Index 2: `targets` User Query
- **Collection**: `targets`
- **Fields**:
  1. `userId` (Ascending)
  2. `createdAt` (Descending)
- **Scope**: Collection
- **Used by**: `subscribeToUserTargets`

### Index 3: `activities` User Query
- **Collection**: `activities`
- **Fields**:
  1. `userId` (Ascending)
  2. `timestamp` (Descending)
- **Scope**: Collection
- **Used by**: `getActivitiesByUser`, `subscribeToUserActivities`

---

## 6. Recommended Firestore Security Rules

To ensure security while accommodating both the current bridge architecture and future per-user authentication, deploy the following production rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && (
        getUserData().role == 'admin' ||
        request.auth.token.email.matches('.*admin.*') ||
        request.auth.token.email.matches('.*cso.*') ||
        request.auth.token.email.matches('.*manager.*')
      );
    }

    // USERS COLLECTION
    match /users/{userId} {
      allow read: if isAuthenticated();
      // Allow user creation by admins or self-registration
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // LEADS COLLECTION
    match /leads/{leadId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // TARGETS COLLECTION
    match /targets/{targetId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ACTIVITIES COLLECTION
    match /activities/{activityId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }
  }
}
```

---

## 7. Authentication Setup & Account Provisioning

### 7.1 Sign-In Method
- In Firebase Console > **Authentication** > **Sign-in method**:
  - Enable **Email/Password**.

### 7.2 Authorized Domains
- In Firebase Console > **Authentication** > **Settings** > **Authorized domains**, add:
  - `localhost`
  - `127.0.0.1`
  - New company domain (e.g. `crm.syntraxs.com`, `syntraxs.com`)
  - Cloudflare / Vercel preview and production domains

### 7.3 Initial Accounts Setup
1. **Administrative Bridge Account**:
   - Create account in Firebase Auth: `admin@syntraxs.com` (or retain bridge `admin@zoopiter.com` during transition).
2. **Initial Firestore Administrator Document**:
   - Create document in `users` collection:
     ```json
     {
       "name": "Syntraxs Administrator",
       "email": "admin@syntraxs.com",
       "role": "admin",
       "phone": "+91 9999999999",
       "department": "Management",
       "createdAt": "SERVER_TIMESTAMP"
     }
     ```
3. **Sales Team Roster**:
   - Pre-populate required company sales representatives in `users` collection with `role: "sales"`.

---

## 8. Requirements Verification Checklist

### 1. Project Configuration
- [ ] New Firebase Project created in target region (e.g., `asia-south1` or `us-central1`).
- [ ] Web Application registered in Firebase Console.
- [ ] Firebase credentials (`API_KEY`, `PROJECT_ID`, `APP_ID`, etc.) generated.

### 2. Authentication Configuration
- [ ] Email/Password sign-in provider enabled.
- [ ] Authorized domains configured.
- [ ] Initial administrative account created.

### 3. Database Configuration
- [ ] Cloud Firestore initialized in Production mode.
- [ ] Security rules reviewed and published.
- [ ] Composite indexes created in Firestore.

### 4. Items for New Company Administrator Confirmation
- [ ] Does the new company require the admin bridge account to use their corporate domain (`admin@syntraxs.com`) instead of the legacy `admin@zoopiter.com`?
- [ ] Are historical leads, targets, and users from the previous environment being migrated (Scenario B), or is this a clean slate deployment (Scenario A)?
- [ ] Which production domain(s) should be authorized for Firebase Auth?
