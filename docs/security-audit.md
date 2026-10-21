# SYNTRAXS CRM — Comprehensive Production Security Audit & Attack Surface Analysis

> **Target Application:** `lovable-syntraxs-ui` (Syntraxs Technologies Enterprise CRM)  
> **Workspace Root:** `c:\Users\Asus\Downloads\Syntraxs-Proj\zoopiter_crm_oct\lovable-syntraxs-ui`  
> **Audit Date:** October 2026  
> **Status:** Phase 1 Complete — Pending Hardening Implementation  
> **Classification:** Confidential / Enterprise Security Document  
> **Auditor Roles:** Senior Application Security Engineer, Firebase Security Architect, Penetration Testing Specialist

---

## Executive Summary

A comprehensive pre-remediation security audit and vulnerability assessment was conducted on the **Syntraxs Technologies CRM** codebase (`lovable-syntraxs-ui`). The audit reviewed client-side React/TypeScript source code, Firebase initialization and authentication flows, Firestore queries and real-time listeners, user provisioning mechanisms, environment configurations, error handling, Vite and SSR build tooling, public asset distribution, dependency trees, and Git repository history.

The audit identified **15 key security findings** across five severity tiers:
- **3 Critical Severity** (Bypassable authentication backdoor, Firestore privilege escalation, command injection in dependency tree)
- **5 High Severity** (Cross-user data leakage in subscriptions, unauthorized user provisioning, console PII leakage, Excel DoS vulnerability, CSV formula injection)
- **5 Medium Severity** (Public lead data exposure in static assets, hardcoded fallback config, desktop notification PII leak, missing HTTP security headers, vulnerable transitive packages)
- **2 Low / Informational** (Pre-filled credentials in login UI, unversioned Firestore rules file)

All findings are documented below with technical evidence, blast radius analysis, and proposed non-breaking remediation strategies.

---

## Vulnerability Summary Matrix

| ID | Title | Severity | Category | File(s) Affected |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Hardcoded Admin Credentials & Automatic Authentication Backdoor | **Critical** | Authentication Bypass / Broken Auth | `src/services/authService.ts`, `src/context/CRMContext.tsx` |
| **SEC-02** | Privilege Escalation Vulnerability via Email Substring Matching | **Critical** | Broken Access Control | `docs/firebase-security-and-environment.md`, Firestore Rules |
| **SEC-03** | Command Injection Vulnerability in Dependency Tree (`shell-quote`) | **Critical** | Supply Chain / Vulnerable Dependency | `package.json`, `bun.lock` |
| **SEC-04** | Over-Privileged Firestore Query Leaking All Company Leads to Sales Reps | **High** | Data Minimization / Least Privilege | `src/context/CRMContext.tsx`, `src/services/leadService.ts` |
| **SEC-05** | Unenforced Role Validation on Client-Side User Account Provisioning | **High** | Broken Authorization / Account Takeover | `src/services/userService.ts` |
| **SEC-06** | Plaintext PII (Emails & Internal Codes) Exposed in Browser Console Logs | **High** | Sensitive Data Exposure / Logging | `src/services/*.ts`, `src/config/firebase.ts` |
| **SEC-07** | Client-Side Resource Exhaustion & Denial of Service via Excel Import | **High** | Denial of Service / Uncontrolled Resource | `src/routes/admin.leads.tsx` |
| **SEC-08** | CSV & Spreadsheet Formula Injection (CWE-1236) | **High** | Injection / Client Exploitation | `src/routes/admin.leads.tsx` |
| **SEC-09** | Synthetic Customer Lead Documents Served Publicly in `public/` Root | **Medium** | Information Disclosure / Static Assets | `public/syntraxs_10_client_demo_leads.*` |
| **SEC-10** | Hardcoded Fallback Firebase Project Configuration in Source Code | **Medium** | Security Misconfiguration / Secret Sprawl | `src/config/firebase.ts` |
| **SEC-11** | Customer Contact Numbers Leaked to OS Desktop Notification Banner | **Medium** | Privacy Violation / PII Leakage | `src/context/CRMContext.tsx` |
| **SEC-12** | Missing Standard HTTP Security Headers on Web Server Responses | **Medium** | Security Misconfiguration / Clickjacking | `src/server.ts`, `public/_headers` |
| **SEC-13** | Known Security Vulnerabilities in Transitive Packages (`xlsx`, `vite`, `grpc`) | **Medium** | Supply Chain / Vulnerable Dependencies | `package.json` |
| **SEC-14** | Pre-Filled Default Password in Login Screen Quick Buttons | **Low** | Credential Management / Weak Defaults | `src/components/crm/LoginScreen.tsx` |
| **SEC-15** | Missing Version-Controlled `firestore.rules` and `firebase.json` | **Low** | Infrastructure as Code / Drift Risk | Repository Root |

---

## Detailed Audit Findings

### [SEC-01] Critical: Hardcoded Admin Credentials & Automatic Authentication Backdoor
- **Severity:** Critical (CVSS 9.8)
- **CWE:** CWE-798 (Use of Hard-coded Credentials), CWE-287 (Improper Authentication)
- **Evidence:**
  In `src/services/authService.ts`:
  ```typescript
  export const ensureFirebaseAuth = async (): Promise<boolean> => {
    if (!isFirebaseEnabled() || !auth) return false;
    if (auth.currentUser) return true;
    try {
      await signInWithEmailAndPassword(auth, 'admin@syntraxs.com', 'password123');
      return true;
    } catch (err: any) { ... }
  };
  ```
  In `src/context/CRMContext.tsx`:
  ```typescript
  authService.ensureFirebaseAuth().then((ready) => {
    if (!cancelled && ready) startSubscriptions();
  });
  ```
- **Impact:**
  Whenever an unauthenticated user loads the application or reloads the browser, `CRMContext.tsx` automatically attempts to sign into Firebase using a hardcoded email and default password. This was originally introduced as a convenience helper for local testing, but in production, it acts as an authentication backdoor that automatically authenticates sessions with admin privileges and exposes default administrative credentials in the client JavaScript bundle.
- **Proposed Fix:**
  1. Completely remove `ensureFirebaseAuth` from `authService.ts` and `CRMContext.tsx`.
  2. Data subscriptions in `CRMContext.tsx` must only start if a valid user session is verified (`auth.currentUser != null`).
  3. If unauthenticated, redirect to `/login` and do not initiate any Firestore listeners.

---

### [SEC-02] Critical: Privilege Escalation Vulnerability via Email Substring Matching
- **Severity:** Critical (CVSS 9.1)
- **CWE:** CWE-285 (Improper Authorization), CWE-269 (Improper Privilege Management)
- **Evidence:**
  In `docs/firebase-security-and-environment.md`:
  ```javascript
  function isAdmin() {
    return isAuthenticated() && (
      getUserData().role == 'admin' ||
      request.auth.token.email.matches('.*admin.*') ||
      request.auth.token.email.matches('.*cso.*') ||
      request.auth.token.email.matches('.*manager.*')
    );
  }
  ```
  Furthermore, the rule definition allows:
  ```javascript
  match /users/{userId} {
    allow update: if isAuthenticated();
  }
  ```
- **Impact:**
  Any user who registers with an email address containing "admin" (e.g., `attacker.admin@example.com` or `sales-admin-rep@domain.com`) automatically receives full administrative rights in Cloud Firestore. Furthermore, because `match /users/{userId}` allows updates without role protection, an unprivileged sales representative can modify their own Firestore user document to set `role: "admin"`.
- **Proposed Fix:**
  1. Author an official `firestore.rules` file in the repository root.
  2. Eliminate all email regex matching for authorization decisions.
  3. Authorize administrative actions strictly based on Firestore user documents (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'`).
  4. Explicitly prevent non-administrators from modifying the `role` field on user documents:
     `allow update: if isAdmin() || (isOwner(userId) && request.resource.data.role == resource.data.role);`

---

### [SEC-03] Critical: Command Injection in Dependency Tree (`shell-quote`)
- **Severity:** Critical (CVSS 9.8)
- **CWE:** CWE-78 (Improper Neutralization of Special Elements used in an OS Command)
- **Evidence:**
  `npm audit` reported:
  `shell-quote 1.8.4 - 1.10.0: quote() command injection via a line terminator in a token after a { comment } token - GHSA-pqg4-j6r4-53mv`
- **Impact:**
  Allows command injection when parsing shell commands, risking arbitrary code execution in CI/CD pipelines, dev servers, and build processes.
- **Proposed Fix:**
  Apply dependency resolution / package overrides in `package.json` to enforce patched version of `shell-quote` (>= 1.10.1 or latest safe version).

---

### [SEC-04] High: Over-Privileged Firestore Query Leaking All Company Leads to Sales Reps
- **Severity:** High (CVSS 7.5)
- **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor), CWE-213 (Exposure of Sensitive Information Due to Incompatible Policies)
- **Evidence:**
  In `src/context/CRMContext.tsx`:
  ```typescript
  unsubLeads = leadService.subscribeToLeads((fetchedLeads) => {
    setLeads(fetchedLeads || []);
  });
  ```
  `CRMContext.tsx` fetches the entire `leads` collection for every user, regardless of role, and relies solely on frontend filtering:
  ```typescript
  const relevantLeads = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return leads;
    return leads.filter(l => l.assignedTo === currentUser.id || ...);
  }, [leads, currentUser]);
  ```
- **Impact:**
  A sales representative's browser receives every single customer lead across the company, including unassigned enterprise accounts, other sales reps' pipeline values, deal sizes, client contact emails, and confidential deal notes. Any sales user can open DevTools or React Developer Tools and view competitors' leads or all internal company deals. Additionally, when backend Firestore security rules are enforced, `subscribeToLeads` fails with `permission-denied` for sales users.
- **Proposed Fix:**
  In `CRMContext.tsx`, dynamically select the subscription query based on user role:
  - If `currentUser.role === 'admin'`: subscribe to `leadService.subscribeToLeads(...)`.
  - If `currentUser.role === 'sales'`: subscribe to `leadService.subscribeToUserLeads(currentUser.id, ...)`.

---

### [SEC-05] High: Unenforced Role Validation on Client-Side User Account Provisioning
- **Severity:** High (CVSS 7.1)
- **CWE:** CWE-285 (Improper Authorization)
- **Evidence:**
  In `src/services/userService.ts`:
  ```typescript
  export const createSalesUser = async (input: CreateSalesRepresentativeInput) => {
    // No role check verifying caller is admin!
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    ...
  }
  ```
- **Impact:**
  Any authenticated client session (including sales representatives) can invoke `createSalesUser` directly via console or API calls to create new Firebase Auth user accounts and inject documents into Firestore `users` and `targets`.
- **Proposed Fix:**
  Add a strict authorization check at the top of `createSalesUser`:
  ```typescript
  const activeUser = authService.getActiveUser();
  if (!activeUser || activeUser.role !== 'admin') {
    return { success: false, error: 'Unauthorized: Only CRM administrators can provision users.' };
  }
  ```

---

### [SEC-06] High: Plaintext PII (Emails & Internal Codes) Exposed in Browser Console Logs
- **Severity:** High (CVSS 6.5)
- **CWE:** CWE-532 (Insertion of Sensitive Information into Log File)
- **Evidence:**
  In `src/services/authService.ts`:
  ```typescript
  console.warn('❌ [AUTH] Sign in failed for:', cleanEmail, err?.code, err?.message);
  ```
  Throughout `src/services/*.ts`:
  ```typescript
  console.error('❌ [USERS] Failed to fetch users:', error.message);
  console.error('❌ [LEADS] Failed to create lead:', error.message);
  ```
- **Impact:**
  Customer and employee email addresses, raw Firebase error codes, database paths, and implementation details are logged in the browser console. Attackers or third-party browser extensions can scrape this information.
- **Proposed Fix:**
  1. Build a production-safe logger (`src/lib/logger.ts`) with automatic PII redaction and level-based filtering.
  2. Configure Vite/esbuild to drop debug and verbose log calls in production builds (`pure: ['console.log', 'console.debug', 'console.info']`).
  3. Replace verbose raw error objects with sanitized error messages.

---

### [SEC-07] High: Client-Side Resource Exhaustion & Denial of Service via Excel Import
- **Severity:** High (CVSS 7.5)
- **CWE:** CWE-400 (Uncontrolled Resource Consumption), CWE-770 (Allocation of Resources Without Limits or Throttling)
- **Evidence:**
  In `src/routes/admin.leads.tsx`:
  ```typescript
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const workbook = XLSX.read(data, { type: "binary", cellDates: true });
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      for (let i = 1; i < jsonData.length; i++) {
        await addLead(leadsToImport[i]);
      }
    };
  };
  ```
- **Impact:**
  No checks on file size, row count, or MIME type exist. An uploaded 100MB file or a spreadsheet with 50,000 rows causes the browser tab to hang, freeze memory, and initiate unthrottled sequential Firestore writes, exhausting quotas and causing massive billing spikes.
- **Proposed Fix:**
  1. Enforce strict file size validation (max 5MB).
  2. Enforce row limit (max 500 rows per import).
  3. Validate file extension (`.xlsx`, `.xls`, `.csv`).
  4. Sanitize and validate every row schema before importing.

---

### [SEC-08] High: CSV & Spreadsheet Formula Injection (CWE-1236)
- **Severity:** High (CVSS 7.8)
- **CWE:** CWE-1236 (Improper Neutralization of Formula Elements in a CSV File)
- **Evidence:**
  In `src/routes/admin.leads.tsx`:
  ```typescript
  const rows = leads.map((l, i) => [
    l.id || `L-${1000 + i}`,
    `"${(l.companyName || "").replace(/"/g, '""')}"`,
    `"${(l.contactName || "").replace(/"/g, '""')}"`,
    ...
  ]);
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  ```
- **Impact:**
  If a malicious user submits a lead with a company name or contact starting with `=cmd|' /C calc'!A0` or `@SUM(...)` or `+`, Microsoft Excel or LibreOffice will execute the formula or prompt DDE code execution upon opening the exported CSV file.
- **Proposed Fix:**
  Prefix any exported string that begins with `=`, `+`, `-`, `@`, `\t`, or `\r` with an apostrophe `'`, neutralizing spreadsheet execution.

---

### [SEC-09] Medium: Synthetic Customer Lead Documents Served Publicly in `public/` Root
- **Severity:** Medium (CVSS 5.3)
- **CWE:** CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor)
- **Evidence:**
  Tracked files:
  - `public/syntraxs_10_client_demo_leads.csv`
  - `public/syntraxs_10_client_demo_leads.xlsx`
- **Impact:**
  Vite automatically copies files in `public/` to `.output/public/`, making them downloadable by anyone at `https://<domain>/syntraxs_10_client_demo_leads.csv` without authentication. While these are currently synthetic leads, shipping customer-like data in public directories establishes a dangerous precedent and invites information-gathering attacks.
- **Proposed Fix:**
  Relocate demo fixtures to a private test directory (`src/test/fixtures/`) and remove them from `public/`.

---

### [SEC-10] Medium: Hardcoded Fallback Firebase Project Configuration in Source Code
- **Severity:** Medium (CVSS 4.3)
- **CWE:** CWE-540 (Inclusion of Sensitive Information in Source Code)
- **Evidence:**
  In `src/config/firebase.ts`:
  ```typescript
  const SYNTRAXS_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDYBDR-7wEJx8s7LOME-Dm6iCtxhj_72a0',
    authDomain: 'crm-syntraxs.firebaseapp.com',
    projectId: 'crm-syntraxs',
    ...
  };
  ```
- **Impact:**
  If environment variables are omitted or misconfigured in staging/testing environments, the client application silently connects to the production Firebase project. In multi-tenant white-label distributions, hardcoded values leak the master project configuration.
- **Proposed Fix:**
  Read strictly from `import.meta.env`. Provide clear diagnostic errors in development if variables are missing, and fail gracefully without hardcoding fallback production parameters.

---

### [SEC-11] Medium: Customer Contact Numbers Leaked to OS Desktop Notification Banner
- **Severity:** Medium (CVSS 4.3)
- **CWE:** CWE-359 (Exposure of Private Personal Information)
- **Evidence:**
  In `src/context/CRMContext.tsx`:
  ```typescript
  new Notification(`💡 Client Interested: ${compName}`, {
    body: `${repName} marked ${clientName} as Interested!\nPhone: ${lead.phone || 'N/A'}`,
  });
  new Notification(`🔔 Follow-up: ${lead.companyName}`, {
    body: `Scheduled in ${minutesRemaining}m with ${lead.contactName} (${lead.phone})`,
  });
  ```
- **Impact:**
  Customer mobile numbers appear on operating system lock screens and desktop popups, violating data minimization principles and risking shoulder-surfing privacy breaches.
- **Proposed Fix:**
  Strip phone numbers and private contact information from OS desktop notifications; keep only client name and company name.

---

### [SEC-12] Medium: Missing Standard HTTP Security Headers on Web Server Responses
- **Severity:** Medium (CVSS 5.4)
- **CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers or Frames), CWE-16 (Configuration)
- **Evidence:**
  In `src/server.ts` and `.output/public/_headers`:
  Only `cache-control` is configured for `/assets/*`. No security headers are returned.
- **Impact:**
  The CRM can be embedded inside malicious IFrames on external domains (clickjacking). Lack of `X-Content-Type-Options` permits MIME sniffing.
- **Proposed Fix:**
  Add standard security headers in `src/server.ts` and `public/_headers`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Cross-Origin-Opener-Policy: same-origin`

---

### [SEC-13] Medium: Known Security Vulnerabilities in Transitive Packages (`xlsx`, `vite`, `grpc`)
- **Severity:** Medium (CVSS 5.5)
- **CWE:** CWE-1395 (Dependency on Vulnerable Third-Party Component)
- **Evidence:**
  `npm audit` detected:
  - `xlsx`: Prototype Pollution (GHSA-4r6h-8v6p-xvw6), ReDoS (GHSA-5pgg-2g8v-p4x9)
  - `@grpc/grpc-js`: GHSA-m9gg-hp2v-232j
  - `brace-expansion`: GHSA-mh99-v99m-4gvg
  - `vite`: GHSA-698v-4r3x-3vcv
- **Impact:**
  Potential denial of service or prototype manipulation if untrusted Excel files or crafted strings are processed.
- **Proposed Fix:**
  1. Apply object prototype freezing / defensive validation before passing untrusted workbook data.
  2. Update safe dependencies using minimal, non-breaking version bumps.

---

### [SEC-14] Low: Pre-Filled Default Password in Login Screen Quick Buttons
- **Severity:** Low (CVSS 3.1)
- **CWE:** CWE-522 (Insufficiently Protected Credentials)
- **Evidence:**
  In `src/components/crm/LoginScreen.tsx`:
  Quick login buttons set `password123` on click, and initial state pre-fills default credentials.
- **Impact:**
  In production environments, visitors can click a quick button and immediately submit known credentials.
- **Proposed Fix:**
  Disable automatic password pre-filling in production mode (`import.meta.env.PROD`). Allow quick buttons to fill email only, requiring the user to type their actual password.

---

### [SEC-15] Low: Missing Version-Controlled `firestore.rules` and `firebase.json`
- **Severity:** Low (CVSS 3.0)
- **CWE:** CWE-1059 (Incomplete Documentation / Configuration Drift)
- **Evidence:**
  No `firestore.rules` or `firebase.json` file is present in the repository root.
- **Impact:**
  Security rules cannot be reviewed in pull requests, tested in automated CI pipelines, or deployed via `firebase deploy --only firestore:rules`.
- **Proposed Fix:**
  Create a hardened `firestore.rules` and `firebase.json` in the project root.

---

## Action Plan & Remediation Roadmap

1. **Phase 2 — Secure Logging & Error Messages:**
   - Create `src/lib/logger.ts` with PII masking.
   - Refactor all `console.*` calls across `src/services/` and `src/config/`.
   - Configure Vite build with `pure: ['console.log', 'console.debug', 'console.info']`.

2. **Phase 3 — Protect Frontend Build Artifacts:**
   - Enforce `sourcemap: false` in production Vite configuration.
   - Relocate demo lead spreadsheets from `public/` to `src/test/fixtures/`.
   - Audit `.output/public` to ensure zero secret leakage.

3. **Phase 4 & 5 — Firebase Authentication, Authorization & Credential Protection:**
   - Remove `ensureFirebaseAuth` backdoor.
   - Restrict `userService.createSalesUser` to verified admin callers.
   - Provide production-grade `firestore.rules` with strict role enforcement and zero email-matching heuristics.
   - Require active Firebase Auth session before starting Firestore listeners.

4. **Phase 6 & 7 — Customer Data Minimization & Web Attack Protection:**
   - Scope Firestore subscriptions in `CRMContext.tsx` by role (sales reps only receive assigned leads).
   - Sanitize CSV exports against formula injection (`=`, `@`, `+`, `-`).
   - Add file size and row count guards to Excel import handler.
   - Add HTTP security headers to `src/server.ts` and `public/_headers`.
   - Sanitize desktop notifications to exclude phone numbers.

5. **Phase 8 & 9 — Dependencies & Git Verification:**
   - Verify `.gitignore` rules.
   - Run safe dependency audits and updates.
   - Verify tests and production build pass with zero regressions.
