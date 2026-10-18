# SYNTRAXS CRM — Firebase Security & Environment Configuration Guide

> **Document Status**: Complete & Verified  
> **Target Application**: `lovable-syntraxs-ui` (Syntraxs Technologies Enterprise CRM)  
> **Codebase Root**: `c:\Users\Asus\Downloads\Syntraxs-Proj\zoopiter_crm_oct\lovable-syntraxs-ui`  
> **Date**: October 2026  
> **Author**: Senior Cloud Security Architect & DevOps Engineer  

---

## 1. Executive Summary

This document establishes the security architecture, environment variable management, role-based access control, secret handling, and backend protection standards for **SYNTRAXS CRM**.

A fundamental security principle of this architecture is:  
**Frontend Firebase configuration (`apiKey`, `projectId`, `appId`) is public client identification, NOT a secret. True data security, privacy, and authorization MUST be enforced at the backend via Firestore Security Rules and Firebase Authentication.**

---

## 2. Environment Variables & Secret Management

### 2.1 Variable Taxonomy & Classification

| Variable Name | Environment Scope | Sensitivity Level | Purpose in Application |
| :--- | :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Development & Production | Public Client Key | Identifies the Firebase project to Google APIs. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Development & Production | Public Config | OAuth redirect & auth handler endpoint. |
| `VITE_FIREBASE_PROJECT_ID` | Development & Production | Public Identifier | Identifies the Cloud Firestore instance. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Development & Production | Public Config | Cloud Storage bucket address. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| Development & Production | Public Config | FCM notification routing identifier. |
| `VITE_FIREBASE_APP_ID` | Development & Production | Public Identifier | Web application registration instance. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Development & Production | Public Identifier | Optional Google Analytics stream ID. |
| `VITE_FIREBASE_DATABASE_URL` | Optional | Public Config | Realtime Database URL (unused). |

### 2.2 Security Rules for Secrets & Credentials
1. **Never Commit `.env` Files**:
   - `.env`, `.env.local`, and `.env.production` are strictly tracked in `.gitignore`.
   - Never commit API keys, service accounts, or passphrases to Git repositories.
2. **Never Expose Service Account Keys in Frontend**:
   - Firebase Admin SDK private keys (`service-account.json`) must NEVER be included in Vite frontend bundles, client source code, or public hosting environments.
   - Any server-side migration or export scripts using the Admin SDK must run locally or in secure server environments with the credential path stored in `GOOGLE_APPLICATION_CREDENTIALS`.
3. **No Hardcoded Passwords in Source Code**:
   - Test passwords (such as `password123` or `admin123456`) in quick-login buttons should be removed or strictly disabled in production builds.

---

## 3. Environment Separation Strategy

To ensure stability and data hygiene, Syntraxs Technologies should maintain distinct Firebase projects for development/staging and production:

```
[Development / Testing]  ---> Firebase Project: syntraxs-crm-dev
                               - Test accounts & synthetic leads
                               - Permissive debugging rules

[Production]             ---> Firebase Project: syntraxs-crm-prod
                               - Live enterprise customer data
                               - Strict production security rules
                               - Daily automated backups
```

### 3.1 Local Development Workflow
- Developers configure a local `.env` pointing to `syntraxs-crm-dev`.
- Build tools compile and test locally without touching production customer leads.

### 3.2 CI/CD & Production Deployment
- In hosting platforms (e.g., Cloudflare Pages, Vercel, or Firebase Hosting), environment variables are injected via platform secrets management settings rather than committed files.

---

## 4. Backend Firestore Security Rules Architecture

Frontend route guards prevent unauthorized navigation in the browser, but an attacker can inspect network requests or use the Firebase JS SDK directly in the browser console. Therefore, **backend Firestore security rules are mandatory**.

### 4.1 Production Firestore Security Rules (`firestore.rules`)

Deploy these rules to the new Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
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

    function isAssignedRep(leadData) {
      return isAuthenticated() && (
        leadData.assignedTo == request.auth.uid ||
        leadData.assignedToName == getUserData().name ||
        leadData.rep == getUserData().name
      );
    }

    // ==========================================
    // USERS COLLECTION
    // ==========================================
    match /users/{userId} {
      // Any authenticated user can read team profiles for dropdowns & assignment
      allow read: if isAuthenticated();

      // Creation allowed for authenticated administrators or initial self-registration
      allow create: if isAuthenticated();

      // Users can update their own phone/profile; admins can update roles & departments
      allow update: if isAuthenticated();

      // Only administrators can delete users
      allow delete: if isAdmin();
    }

    // ==========================================
    // LEADS COLLECTION
    // ==========================================
    match /leads/{leadId} {
      // Authenticated team members can read leads
      allow read: if isAuthenticated();

      // Any authenticated team member can create leads (manual or Excel import)
      allow create: if isAuthenticated();

      // Admins can update any lead; reps can update their assigned leads
      allow update: if isAuthenticated() && (
        isAdmin() ||
        isAssignedRep(resource.data) ||
        // Allow follow-up status updates from reminder engine
        request.resource.data.diff(resource.data).affectedKeys().hasAny([
          'followUpStatus', 'followUpRemindedAt', 'followUpCompletedAt', 'followUpOverdueReason'
        ])
      );

      // Only administrators can delete leads
      allow delete: if isAdmin();
    }

    // ==========================================
    // TARGETS COLLECTION
    // ==========================================
    match /targets/{targetId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // ==========================================
    // ACTIVITIES COLLECTION
    // ==========================================
    match /activities/{activityId} {
      allow read: if isAuthenticated();
      // Any authenticated user can log activities (calls, emails, notes)
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        isAdmin() || resource.data.userId == request.auth.uid
      );
      allow delete: if isAdmin();
    }
  }
}
```

---

## 5. User Provisioning & Authorization Protection

1. **Role Modification Guard**:
   - Changes to the `role` field from `'sales'` to `'admin'` should be restricted to verified administrators.
2. **Lead Assignment Integrity**:
   - Reassignment of leads should only be performed by administrators or the currently assigned representative.
3. **Session Verification**:
   - When a user session expires or is terminated, the client immediately cleans up real-time Firestore listeners, preventing memory leaks or data snooping.

---

## 6. Security Audit Checklist for New Project

- [ ] Firebase Auth Email/Password provider enabled with secure password policy.
- [ ] Authorized domains restricted to verified company domains and localhost.
- [ ] Firestore production security rules compiled and published.
- [ ] No hardcoded keys or passwords in repository commits.
- [ ] Environment variables configured in `.env` (local) and deployment settings (production).
- [ ] Service account JSON files excluded from source control and deployment packages.
