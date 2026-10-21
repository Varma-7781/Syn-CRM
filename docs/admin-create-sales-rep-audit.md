# Feature Report: Admin Creates Sales Accounts Connected to Firebase Authentication

**Project**: `lovable-syntraxs-ui` (Syntraxs Technologies CRM)  
**Date**: October 21, 2026  
**Status**: Implemented, Verified, and Pushed to `main` (commit `e10c149`)  

---

## 1. Architecture Overview

When an administrator creates a new sales representative from the CRM, the system provisions both:
1. A genuine **Firebase Authentication** account (`createUserWithEmailAndPassword`).
2. A matching **Firestore User Profile** document in `users/{authUid}`.
3. An initial **Monthly Target Quota** document in `targets/target_{authUid}_{period}`.

### Critical Requirement: Preserving Administrator Session
To ensure the Administrator is **never signed out** when creating new sales credentials, the architecture uses an **isolated secondary Firebase App instance** (`initializeApp(firebaseConfig, 'provision-sales-...')`).
- The newly created user is provisioned on the secondary auth container.
- The secondary container is cleanly signed out and deleted (`deleteApp`).
- The Administrator's default `auth` token, session state, and localStorage remain 100% untouched.
- Tested and verified: `Admin UID remains unchanged` across creations.

In addition, an enterprise **Firebase Cloud Function** (`createSalesUser`) with Firebase Admin SDK is provided in `functions/src/index.ts` for organizations preferring server-side invocation. If `VITE_CREATE_SALES_FUNCTION_URL` is set, the frontend automatically invokes the Cloud Function with the caller's Firebase ID token.

---

## 2. Files Changed and Created

| File | Type | Description |
|---|---|---|
| [`src/components/crm/AddSalesRepresentativeDialog.tsx`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/components/crm/AddSalesRepresentativeDialog.tsx) | Created | Responsive modal dialog with name, email, password, phone, department, quota inputs, validation, and error states. |
| [`functions/src/index.ts`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/functions/src/index.ts) | Created | Firebase Cloud Function using Firebase Admin SDK with admin authorization and server-side role enforcement. |
| [`functions/package.json`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/functions/package.json) | Created | Node 20 functions configuration for Firebase CLI deployment. |
| [`functions/README.md`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/functions/README.md) | Created | Deployment guide for Firebase CLI. |
| [`src/services/userService.ts`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/services/userService.ts) | Modified | Added `createSalesUser` with secondary auth provisioning, rollback on failure, and target seeding. |
| [`src/context/CRMContext.tsx`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/context/CRMContext.tsx) | Modified | Exposed `createSalesRepresentative` in CRMContext. |
| [`src/routes/admin.team.tsx`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/routes/admin.team.tsx) | Modified | Added `+ Add Sales Representative` primary action button and modal integration. |
| [`src/config/firebase.ts`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/config/firebase.ts) | Modified | Exported `firebaseConfig` for secondary instance provisioning. |
| [`src/types/index.ts`](file:///C:/Users/Asus/Downloads/Syntraxs-Proj/zoopiter_crm_oct/lovable-syntraxs-ui/src/types/index.ts) | Modified | Added `CreateSalesRepresentativeInput` interface. |

---

## 3. Auth UID to Firestore Mapping

- **Auth UID**: Returned by Firebase Authentication (`cred.user.uid`).
- **Firestore Document Path**: `users/${authUid}`.
- **Role Enforcement**: Hardcoded to `'sales'`. Administrators cannot create admin accounts through this form.
- **Initial Target**: Created in `targets/target_${authUid}_${YYYY-MM}` with default target ₹15,00,000.

---

## 4. Verification & Testing Matrix

| Test Case | Result | Details |
|---|---|---|
| **TC-AUTH-01** | ✅ Passed | Administrator creates sales user; account created in Firebase Authentication. |
| **TC-AUTH-02** | ✅ Passed | Matching Firestore document created with ID = Auth UID and `role = 'sales'`. |
| **TC-AUTH-03** | ✅ Passed | Administrator remains 100% signed in after account creation (`test_secondary_auth.mjs`). |
| **TC-AUTH-04** | ✅ Passed | New sales rep can sign in on `/login` and is redirected to `/sales/pipeline`. |
| **TC-AUTH-05** | ✅ Passed | New sales rep cannot access `/admin/*` routes (guarded by role checks). |
| **TC-AUTH-06** | ✅ Passed | Duplicate emails trigger `auth/email-already-in-use` user-friendly error message. |
| **TC-AUTH-07** | ✅ Passed | Weak passwords (< 6 chars) rejected with inline validation warning. |
| **TC-BUILD-01** | ✅ Passed | Full client & SSR production build (`npm run build`) succeeded with 0 errors. |
| **TC-TEST-01** | ✅ Passed | Vitest routing test suite passed. |
